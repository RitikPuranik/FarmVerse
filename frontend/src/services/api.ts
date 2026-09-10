import axios, { AxiosError } from 'axios'

/**
 * Central Axios instance. Every service module (authService, productService,
 * etc.) imports `api` from here so base URL, headers, and interceptors stay
 * in one place.
 *
 * All runtime feature services use the backend API. Keep this module focused
 * on transport, authentication, token refresh, and API error handling.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const ACCESS_TOKEN_KEY = 'farmverse.authToken'
const REFRESH_TOKEN_KEY = 'farmverse.refreshToken'

export function getAccessToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setSessionTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearSessionTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

/**
 * On a 401 (expired access token), try exactly once to exchange the refresh
 * token for a new pair and replay the original request. If that fails too,
 * the session is dead — clear it and let the error propagate so route
 * guards / AuthContext can react.
 */
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
      .then((res) => {
        const { accessToken, refreshToken: nextRefreshToken } = res.data.data
        setSessionTokens(accessToken, nextRefreshToken)
        return accessToken as string
      })
      .catch(() => {
        clearSessionTokens()
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

/**
 * Endpoints where a 401 means "this credential/token is actually invalid"
 * (wrong password, expired OTP, dead refresh token, ...) — retrying via
 * refresh would be pointless or, for /auth/refresh itself, an infinite loop.
 * Every OTHER endpoint — including /auth/me and /auth/logout — is a normal
 * token-protected resource: a 401 there just means the 15-minute access
 * token expired, which the refresh-and-retry flow below is exactly for.
 */
const NO_REFRESH_RETRY_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
]

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined
    const status = error.response?.status
    const isNoRetryPath = NO_REFRESH_RETRY_PATHS.some((path) => original?.url?.includes(path))

    if (status === 401 && original && !original._retried && !isNoRetryPath) {
      original._retried = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api.request(original)
      }
    }
    return Promise.reject(error)
  },
)

/** Pulls a readable message out of a failed Axios request, matching the backend's { success:false, message } shape. */
/**
 * Pulls a readable message out of an Axios request, matching the backend's
 * `{ success:false, message, details? }` shape. Validation errors (400s from
 * the Zod `validate` middleware) carry a generic top-level message plus a
 * `details` array of per-field reasons, so surface those first.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; details?: Array<{ field: string; message: string }> }
      | undefined
    if (data?.details?.length) {
      return data.details.map((d) => d.message).join(' ')
    }
    return data?.message ?? fallback
  }
  return fallback
}
