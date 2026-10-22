import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Chatbot from '../components/Chatbot'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  KeyIcon,
  MapPinIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const getRoleLabel = (role) => {
  const labels = {
    citoyen: 'Citoyen',
    admin: 'Administrateur',
    collaborateur: 'Collaborateur',
    police: 'Agent de police',
    commissariat: 'Commissariat',
    gendarmerie: 'Gendarmerie'
  }
  const normalized = String(role || '').toLowerCase()
  return labels[normalized] || role || 'Membre'
}

export default function Settings() {
  const { user, loading: authLoading, logout, changePassword } = useAuth()
  const router = useRouter()
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' })

  const updatePasswordField = (event) => {
    const { name, value } = event.target
    setPasswords((current) => ({ ...current, [name]: value }))
    setPasswordError('')
  }

  const submitPasswordChange = async (event) => {
    event.preventDefault()
    setPasswordError('')
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmation) {
      setPasswordError('Renseignez les trois champs pour continuer.')
      return
    }
    if (passwords.newPassword !== passwords.confirmation) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setPasswordError('Choisissez un mot de passe différent de l’actuel.')
      return
    }

    setPasswordLoading(true)
    const updated = await changePassword({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    })
    setPasswordLoading(false)
    if (updated) {
      setPasswords({ currentPassword: '', newPassword: '', confirmation: '' })
      setPasswordFormOpen(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (authLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 pt-28">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-40 rounded-3xl bg-white shadow-sm" />
          <div className="h-32 rounded-3xl bg-white shadow-sm" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Head><title>Paramètres - Signal-Moi</title></Head>
        <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 pt-20">
          <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheckIcon className="h-7 w-7" /></span>
            <h1 className="mt-5 text-2xl font-black text-slate-950">Connectez-vous</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Vos paramètres de compte sont disponibles après connexion.</p>
            <Link href="/login" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800">Se connecter</Link>
          </section>
        </main>
      </>
    )
  }

  const initials = [user.prenom?.[0], user.nom?.[0]].filter(Boolean).join('').toUpperCase() || 'SM'
  const memberSince = user.created_at ? new Date(user.created_at) : null
  const memberSinceLabel = memberSince && !Number.isNaN(memberSince.getTime())
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(memberSince)
    : 'Date indisponible'
  const location = [user.quartier, user.ville].filter(Boolean).join(', ')

  return (
    <>
      <Head>
        <title>Mes paramètres - Signal-Moi</title>
        <meta name="description" content="Gérez les informations et la sécurité de votre compte Signal-Moi." />
      </Head>

      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,.10),_transparent_35rem),linear-gradient(to_bottom,#f8fafc,#f1f5f9)] px-4 pb-14 pt-24 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-5xl">
          <motion.button
            type="button"
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-800"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Retour
          </motion.button>

          <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">Espace personnel</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Paramètres</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Consultez les informations de votre compte et protégez votre accès à Signal-Moi.</p>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            aria-label="Profil utilisateur"
            className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-[0_24px_65px_rgba(6,78,59,.18)] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.6rem] border border-white/20 bg-white/10 text-2xl font-black shadow-inner backdrop-blur">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-200">Votre compte</p>
                <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">{[user.prenom, user.nom].filter(Boolean).join(' ') || 'Membre Signal-Moi'}</h2>
                <p className="mt-1 break-all text-sm text-slate-300">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    <ShieldCheckIcon className="h-3.5 w-3.5" /> {getRoleLabel(user.role)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                    <CalendarDaysIcon className="h-3.5 w-3.5" /> Membre depuis {memberSinceLabel}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.055)] sm:p-6"
            >
              <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserCircleIcon className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-extrabold text-slate-950">Informations du compte</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Vos coordonnées associées à votre profil.</p>
                </div>
              </div>
              <dl className="mt-2 divide-y divide-slate-100">
                <div className="flex items-start gap-3 py-4">
                  <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <dt className="w-24 shrink-0 text-sm font-medium text-slate-500">E-mail</dt>
                  <dd className="min-w-0 break-all text-right text-sm font-bold text-slate-900 sm:ml-auto">{user.email || 'Non renseigné'}</dd>
                </div>
                <div className="flex items-start gap-3 py-4">
                  <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <dt className="w-24 shrink-0 text-sm font-medium text-slate-500">Rôle</dt>
                  <dd className="ml-auto text-right text-sm font-bold text-slate-900">{getRoleLabel(user.role)}</dd>
                </div>
                {user.telephone && <div className="flex items-start gap-3 py-4">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-xs text-slate-400" aria-hidden="true">☎</span>
                  <dt className="w-24 shrink-0 text-sm font-medium text-slate-500">Téléphone</dt>
                  <dd className="ml-auto text-right text-sm font-bold text-slate-900">{user.telephone}</dd>
                </div>}
                {location && <div className="flex items-start gap-3 py-4">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <dt className="w-24 shrink-0 text-sm font-medium text-slate-500">Localisation</dt>
                  <dd className="ml-auto text-right text-sm font-bold text-slate-900">{location}</dd>
                </div>}
              </dl>
              <Link href="/profile" className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">
                Modifier mon profil <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </motion.section>

            <div className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.055)] sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><ShieldCheckIcon className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-extrabold text-slate-950">Sécurité</h2>
                    <p className="mt-0.5 text-sm leading-5 text-slate-500">Gardez votre compte protégé avec un mot de passe que vous seul connaissez.</p>
                  </div>
                </div>
                {!passwordFormOpen ? (
                  <button
                    type="button"
                    onClick={() => { setPasswordError(''); setPasswordFormOpen(true) }}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                  >
                    <KeyIcon className="h-4 w-4" /> Changer mon mot de passe
                  </button>
                ) : (
                  <form onSubmit={submitPasswordChange} className="mt-5 space-y-3">
                    {[
                      { name: 'currentPassword', label: 'Mot de passe actuel', autoComplete: 'current-password' },
                      { name: 'newPassword', label: 'Nouveau mot de passe', autoComplete: 'new-password' },
                      { name: 'confirmation', label: 'Confirmer le nouveau mot de passe', autoComplete: 'new-password' }
                    ].map((field) => (
                      <label key={field.name} className="block">
                        <span className="mb-1.5 block text-xs font-bold text-slate-700">{field.label}</span>
                        <input
                          type="password"
                          name={field.name}
                          autoComplete={field.autoComplete}
                          value={passwords[field.name]}
                          onChange={updatePasswordField}
                          required
                          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </label>
                    ))}
                    {passwordError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{passwordError}</p>}
                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                      <button type="submit" disabled={passwordLoading} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                        {passwordLoading ? 'Mise à jour…' : <><CheckCircleIcon className="h-4 w-4" /> Enregistrer</>}
                      </button>
                      <button type="button" onClick={() => { setPasswordFormOpen(false); setPasswordError('') }} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Annuler</button>
                    </div>
                  </form>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.055)] sm:p-6"
              >
                <h2 className="font-extrabold text-slate-950">Actions du compte</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Déconnectez-vous ou consultez les options de suppression du compte.</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" /> Me déconnecter
                </button>
                <Link href="/account/delete" className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100">
                  <TrashIcon className="h-4 w-4" /> Supprimer mon compte
                </Link>
              </motion.section>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4 text-xs leading-5 text-slate-500">
            <p className="font-bold text-slate-700">Vos données</p>
            <p className="mt-1">La suppression du compte est définitive. Les signalements résolus ou en cours peuvent être conservés sous une forme anonymisée, conformément aux règles de la plateforme.</p>
          </div>
        </div>
      </main>
      <Chatbot />
    </>
  )
}
