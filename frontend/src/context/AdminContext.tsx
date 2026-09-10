import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sellerService, type SellerApplication } from '@/services/sellerService'
import { useAuth } from '@/context/AuthContext'

interface AdminContextValue {
  sellerApplications: SellerApplication[]
  pendingSellerCount: number
  isLoadingApplications: boolean
  refreshApplications: () => Promise<void>
  approveApplication: (id: string) => Promise<void>
  rejectApplication: (id: string, note: string) => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([])
  const [pendingSellerCount, setPendingSellerCount] = useState(0)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      setSellerApplications([])
      setPendingSellerCount(0)
      return
    }
    setIsLoadingApplications(true)
    try {
      const applications = await sellerService.listApplications()
      setSellerApplications(applications)
      setPendingSellerCount(applications.filter((a) => a.status === 'PENDING').length)
    } finally {
      setIsLoadingApplications(false)
    }
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    void refreshApplications()
    if (!isAuthenticated || !isAdmin) return
    const interval = window.setInterval(() => void refreshApplications(), 30_000)
    return () => window.clearInterval(interval)
  }, [refreshApplications, isAuthenticated, isAdmin])

  const approveApplication = useCallback(async (id: string) => {
    const status = await sellerService.reviewApplication(id, 'APPROVE')
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setPendingSellerCount((prev) => Math.max(0, prev - 1))
  }, [])

  const rejectApplication = useCallback(async (id: string, note: string) => {
    const status = await sellerService.reviewApplication(id, 'REJECT', note)
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setPendingSellerCount((prev) => Math.max(0, prev - 1))
  }, [])

  const value = useMemo(
    () => ({ sellerApplications, pendingSellerCount, isLoadingApplications, refreshApplications, approveApplication, rejectApplication }),
    [sellerApplications, pendingSellerCount, isLoadingApplications, refreshApplications, approveApplication, rejectApplication],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider')
  return ctx
}
