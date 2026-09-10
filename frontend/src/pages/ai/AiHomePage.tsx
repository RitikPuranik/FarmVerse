import { Link } from 'react-router-dom'
import {
  Droplets,
  FlaskConical,
  History,
  Leaf,
  MessageCircle,
  Mic,
  RefreshCw,
  ScanEye,
  Sparkles,
  Sprout,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function AiHomePage() {
  const { t } = useLanguage()

  const FEATURES = [
    { to: '/ai/crop-advisor', label: t('aiHome.cropAdvisor'), desc: t('aiHome.cropAdvisorDesc'), icon: Sprout, color: 'bg-brand-50 text-brand-700' },
    { to: '/ai/disease', label: t('aiHome.diseaseDetection'), desc: t('aiHome.diseaseDetectionDesc'), icon: ScanEye, color: 'bg-danger-50 text-danger-500' },
    { to: '/ai/soil', label: t('aiHome.soilAnalysis'), desc: t('aiHome.soilAnalysisDesc'), icon: FlaskConical, color: 'bg-soil-50 text-soil-700' },
    { to: '/ai/fertilizer', label: t('aiHome.fertilizerAdvice'), desc: t('aiHome.fertilizerAdviceDesc'), icon: Leaf, color: 'bg-gold-50 text-gold-700' },
    { to: '/ai/irrigation', label: t('aiHome.irrigationAdvice'), desc: t('aiHome.irrigationAdviceDesc'), icon: Droplets, color: 'bg-sky-50 text-sky-700' },
    { to: '/ai/crop-rotation', label: t('aiHome.cropRotation'), desc: t('aiHome.cropRotationDesc'), icon: RefreshCw, color: 'bg-brand-50 text-brand-700' },
    { to: '/ai/chat', label: t('aiHome.askAI'), desc: t('aiHome.askAIDesc'), icon: MessageCircle, color: 'bg-gold-50 text-gold-700' },
    { to: '/ai/voice', label: t('aiHome.voiceAssistant'), desc: t('aiHome.voiceAssistantDesc'), icon: Mic, color: 'bg-danger-50 text-danger-500' },
    { to: '/ai/history', label: t('aiHome.aiHistory'), desc: t('aiHome.aiHistoryDesc'), icon: History, color: 'bg-ink-100 text-ink-600' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
          <Sparkles className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl">{t('aiHome.title')}</h1>
          <p className="text-xs text-ink-500">{t('aiHome.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-surface p-4 transition-transform hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.color}`}>
              <f.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-ink-900">{f.label}</span>
            <span className="text-[11px] text-ink-500">{f.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
