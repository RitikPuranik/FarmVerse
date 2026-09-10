import { forwardRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'

export const AdminSellerNavIcon = forwardRef<SVGSVGElement, LucideProps>(function AdminSellerNavIcon(props, ref) {
  const { pendingSellerCount } = useAdmin()

  return (
    <span className="relative inline-flex">
      <ShieldCheck {...props} ref={ref} />
      {pendingSellerCount > 0 && (
        <span
          aria-label={`${pendingSellerCount} pending seller verification requests`}
          className="absolute -right-2 -top-2 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#D84A4A] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[#F8F7F2]"
        >
          {pendingSellerCount > 99 ? '99+' : pendingSellerCount}
        </span>
      )}
    </span>
  )
})
