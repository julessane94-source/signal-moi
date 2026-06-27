import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowTopRightOnSquareIcon as ArrowTopRight,
  BanknotesIcon as Banknotes,
  CheckCircleIcon as CheckCircle,
  ClipboardDocumentIcon as ClipboardDocument,
  CreditCardIcon as CreditCard,
  DevicePhoneMobileIcon as DevicePhoneMobile,
  HeartIcon as Heart,
  ShieldCheckIcon as ShieldCheck
} from '@heroicons/react/24/outline'

const SUPPORT_PHONE = '+221 77 885 16 91'
const SUPPORT_PHONE_COMPACT = '221778851691'
const SUPPORT_EMAIL = 'julessane94@gmail.com'
const PAYPAL_URL = 'https://paypal.me/julessane94'
const WAVE_MERCHANT_URL = 'https://pay.wave.com/m/M_sn_WALm6CkqL2VK/c/sn/'

const amounts = [2000, 5000, 10000, 25000, 50000]

const paymentMethods = [
  {
    id: 'wave',
    name: 'Wave',
    description: 'Transfert mobile rapide vers le numero officiel Wave.',
    detail: SUPPORT_PHONE,
    actionLabel: 'Payer avec Wave',
    icon: DevicePhoneMobile,
    color: 'border-sky-200 bg-sky-50 text-sky-800',
    url: WAVE_MERCHANT_URL,
    fallback: `tel:${SUPPORT_PHONE_COMPACT}`,
    fallbackLabel: 'Appeler le numero'
  },
  {
    id: 'orange',
    name: 'Orange Money',
    description: 'Paiement mobile Orange Money avec montant pre-rempli autant que possible.',
    detail: SUPPORT_PHONE,
    actionLabel: 'Payer avec Orange Money',
    icon: DevicePhoneMobile,
    color: 'border-orange-200 bg-orange-50 text-orange-800',
    appUrl: (amount) => `om://send?phone=${SUPPORT_PHONE_COMPACT}&amount=${amount}`,
    fallback: 'tel:%23144%23',
    fallbackLabel: 'Composer #144#'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Paiement international securise par carte ou compte PayPal.',
    detail: PAYPAL_URL,
    actionLabel: 'Ouvrir PayPal',
    icon: CreditCard,
    color: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    url: PAYPAL_URL
  },
  {
    id: 'bank',
    name: 'Virement bancaire',
    description: 'Demandez les coordonnees bancaires et une facture.',
    detail: SUPPORT_EMAIL,
    actionLabel: 'Envoyer un email',
    icon: Banknotes,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    url: `mailto:${SUPPORT_EMAIL}?subject=Don%20Signal-Moi&body=Bonjour,%20je%20souhaite%20soutenir%20Signal-Moi.`
  }
]

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState(10000)
  const [customAmount, setCustomAmount] = useState('')
  const [copied, setCopied] = useState('')

  const activeAmount = useMemo(() => {
    const custom = Number(customAmount)
    return custom > 0 ? custom : selectedAmount
  }, [customAmount, selectedAmount])

  const copyToClipboard = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(''), 1800)
    } catch (error) {
      setCopied('Copie impossible')
      setTimeout(() => setCopied(''), 1800)
    }
  }

  const openPayment = (method) => {
    if (typeof window === 'undefined') return
    const amount = Math.max(1, Number(activeAmount) || selectedAmount)
    const reference = `Don Signal-Moi ${amount} FCFA - ${SUPPORT_PHONE}`

    try {
      navigator.clipboard?.writeText(reference)
      setCopied(method.name)
      setTimeout(() => setCopied(''), 1800)
    } catch (error) {}

    if (method.appUrl) {
      window.location.href = method.appUrl(amount)
      setTimeout(() => {
        window.location.href = method.fallback
      }, 1200)
      return
    }

    window.open(method.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <Heart className="h-4 w-4" /> Soutien citoyen
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">Soutenir Signal-Moi</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Votre contribution finance l'hebergement, la maintenance, la securisation des preuves et l'amelioration des alertes citoyennes.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-emerald-300">Don selectionne</p>
            <p className="mt-2 text-4xl font-bold">{activeAmount.toLocaleString('fr-FR')} FCFA</p>
            <p className="mt-2 text-sm text-slate-300">Reference conseillee : Signal-Moi + votre nom ou telephone.</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-white/10 p-3"><strong>Serveurs</strong><span className="mt-1 block text-slate-300">24/7</span></div>
              <div className="rounded-xl bg-white/10 p-3"><strong>Preuves</strong><span className="mt-1 block text-slate-300">videos</span></div>
              <div className="rounded-xl bg-white/10 p-3"><strong>Alertes</strong><span className="mt-1 block text-slate-300">police</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Choisir un montant</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {amounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                  className={`rounded-xl border px-4 py-3 text-left transition ${activeAmount === amount && !customAmount ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="block text-lg font-bold">{amount.toLocaleString('fr-FR')}</span>
                  <span className="text-xs text-slate-500">FCFA</span>
                </button>
              ))}
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-700">Montant libre</label>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="Ex: 15000"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid gap-4">
            {paymentMethods.map(method => {
              const Icon = method.icon
              return (
                <div key={method.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${method.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-950">{method.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{method.description}</p>
                        <p className="mt-2 font-mono text-sm text-slate-800">{method.detail}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button onClick={() => openPayment(method)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        {method.actionLabel} <ArrowTopRight className="h-4 w-4" />
                      </button>
                      {method.fallback && (
                        <a href={method.fallback} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          {method.fallbackLabel || 'Finaliser'}
                        </a>
                      )}
                      <button onClick={() => copyToClipboard(method.detail, method.name)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <ClipboardDocument className="h-4 w-4" /> {copied === method.name ? 'Copie' : 'Copier'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Transparence', 'Les dons servent aux couts techniques identifies : hebergement, stockage et maintenance.'],
            ['Securite', 'Les preuves et alertes doivent rester accessibles, rapides et protegees.'],
            ['Facture', `Pour une facture, contactez ${SUPPORT_EMAIL} avec la preuve de paiement.`]
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 flex-none" />
            <p>
              Situation reelle : Wave ouvre maintenant le lien marchand officiel. Orange Money reste sur le flux mobile/USSD tant qu'un lien marchand ou une API Orange Money n'est pas connecte au backend.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
