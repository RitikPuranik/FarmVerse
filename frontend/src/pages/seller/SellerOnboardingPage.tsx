import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, CheckCircle2, ClipboardCheck, MapPin, Sprout, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { TextField } from '@/components/common/FormField'
import { useAuth } from '@/context/AuthContext'
import { sellerService, type SellerVerificationStatus } from '@/services/sellerService'
import { getApiErrorMessage } from '@/services/api'

const STEPS = ['Seller Info', 'Farming Info', 'Location', 'Bank Details', 'Submit']

export default function SellerOnboardingPage() {
  const { user, isSeller } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [farmSize, setFarmSize] = useState('')
  const [primaryCrop, setPrimaryCrop] = useState('')
  const [village, setVillage] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus>('UNSUBMITTED')
  const [verificationNote, setVerificationNote] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [bankName, setBankName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    sellerService.getMyProfile()
      .then((profile) => {
        if (cancelled) return
        setVerificationStatus(profile.verificationStatus)
        setVerificationNote(profile.verificationNote ?? '')
        setBusinessName(profile.businessName)
        setFarmSize(profile.farmSizeAcres != null ? String(profile.farmSizeAcres) : '')
        setPrimaryCrop(profile.primaryCrop ?? '')
        setVillage(profile.village ?? '')
        setAccountHolder(profile.bankAccountHolder ?? '')
        setAccountNumber(profile.bankAccountNumber ?? '')
        setIfsc(profile.bankIfscCode ?? '')
        setBankName(profile.bankName ?? '')
        if (profile.verificationStatus === 'PENDING') setSubmitted(true)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (isSeller && verificationStatus === 'APPROVED') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="mb-3 h-12 w-12 text-brand-600" aria-hidden="true" />
        <h1 className="text-lg">You're already a seller</h1>
        <p className="mt-1 text-sm text-ink-500">Selling tools are available from your Profile or the Buy/Sell switch.</p>
        <Button className="mt-5" onClick={() => navigate('/seller/dashboard')}>
          Go to Seller Dashboard
        </Button>
      </div>
    )
  }

  function next() {
    setError('')
    if (step === 0 && businessName.trim().length < 2) {
      setError('Enter a valid seller or business name.')
      return
    }
    if (step === 1 && (!Number.isFinite(Number(farmSize)) || Number(farmSize) <= 0 || !primaryCrop.trim())) {
      setError('Enter a valid farm size and primary crop.')
      return
    }
    if (step === 2 && village.trim().length < 2) {
      setError('Enter your village or town.')
      return
    }
    if (step === 3) {
      const ifscValue = ifsc.trim().toUpperCase()
      if (accountNumber.trim().length < 6 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscValue) || accountHolder.trim().length < 2 || bankName.trim().length < 2) {
        setError('Enter valid bank account holder, bank name, account number, and IFSC details.')
        return
      }
      setIfsc(ifscValue)
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const profile = await sellerService.apply({
        businessName: businessName.trim(),
        farmSizeAcres: Number(farmSize),
        primaryCrop: primaryCrop.trim(),
        village: village.trim(),
        bankAccountHolder: accountHolder.trim(),
        bankAccountNumber: accountNumber.trim(),
        bankIfscCode: ifsc.trim().toUpperCase(),
        bankName: bankName.trim(),
      })
      setVerificationStatus(profile.verificationStatus)
      setSubmitted(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit your seller application.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
          <ClipboardCheck className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{verificationStatus === 'REJECTED' ? 'Application needs changes' : 'Application submitted'}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {verificationStatus === 'REJECTED'
            ? verificationNote || 'Please update your details and re-submit for verification.'
            : 'Pending Verification. Your application will be reviewed by an administrator.'}
        </p>
        <p className="mt-3 text-xs text-ink-400">Once approved, seller tools appear automatically on your existing account — no new login needed.</p>
        <Button className="mt-6" onClick={() => navigate('/profile')}>Back to Profile</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Become a Seller</h1>
      <p className="mb-5 text-sm text-ink-500">One account — this adds selling tools to your existing FarmVerse login.</p>
      <StepperHeader steps={STEPS} currentIndex={step} />
      {error && <p className="mb-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}

      {step === 0 && (
        <div>
          <TextField id="business-name" label="Seller / Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          <TextField id="phone" label="Contact Phone" value={user?.phone ?? ''} disabled />
          <Button fullWidth onClick={next}>Continue</Button>
        </div>
      )}
      {step === 1 && (
        <div>
          <TextField id="farm-size" label="Farm Size (acres)" type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} required />
          <TextField id="primary-crop" label="Primary Crop" value={primaryCrop} onChange={(e) => setPrimaryCrop(e.target.value)} required />
          <Button fullWidth onClick={next}>Continue</Button>
        </div>
      )}
      {step === 2 && (
        <div>
          <TextField id="village" label="Village / Town" value={village} onChange={(e) => setVillage(e.target.value)} required />
          <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-400"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />This location is shown to buyers on your listings.</p>
          <Button fullWidth onClick={next}>Continue</Button>
        </div>
      )}
      {step === 3 && (
        <div>
          <TextField id="account-holder" label="Account Holder Name" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required />
          <TextField id="bank-name" label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
          <TextField id="account-number" label="Bank Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
          <TextField id="ifsc" label="IFSC Code" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} required />
          <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-400"><Banknote className="h-3.5 w-3.5" aria-hidden="true" />Used for payouts on completed orders.</p>
          <Button fullWidth onClick={next}>Continue</Button>
        </div>
      )}
      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <div className="mb-5 space-y-2 rounded-2xl border border-ink-100 bg-surface p-4 text-sm">
            <p className="flex items-center gap-2 text-ink-700"><User className="h-4 w-4 text-brand-600" aria-hidden="true" />{businessName}</p>
            <p className="flex items-center gap-2 text-ink-700"><Sprout className="h-4 w-4 text-brand-600" aria-hidden="true" />{farmSize} acres · {primaryCrop}</p>
            <p className="flex items-center gap-2 text-ink-700"><MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />{village}</p>
          </div>
          <Button type="submit" fullWidth loading={isSubmitting}>{verificationStatus === 'REJECTED' ? 'Re-submit Application' : 'Submit Application'}</Button>
        </form>
      )}
    </div>
  )
}
