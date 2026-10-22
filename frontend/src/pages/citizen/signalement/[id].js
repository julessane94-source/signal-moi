import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Link from 'next/link'
import { API_BASE } from '../../../config/api'

const getDashboardPath = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase()
  if (['admin', 'administrateur'].includes(normalizedRole)) return '/admin/dashboard'
  if (['collaborateur', 'collaborator'].includes(normalizedRole)) return '/collaborator/dashboard'
  if (['commissariat', 'police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizedRole)) return '/police/dashboard'
  return '/citizen/dashboard'
}

const formatStatus = (status) => {
  const labels = {
    nouveau: 'Reçu par la plateforme',
    en_cours: 'En traitement',
    transfere: 'Transféré',
    traite: 'Traité',
    closed: 'Clôturé',
    sur_place: 'Police sur place',
    intervention_terminee: 'Intervention terminée',
    fausse_alerte: 'Fausse alerte'
  }
  return labels[status] || status || 'En attente'
}

const formatDateTime = (value) => {
  if (!value) return 'Non renseigné'
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Non renseigné'
  }
}

export default function SignalementDetail() {
  const router = useRouter()
  const { id } = router.query
  const [signal, setSignal] = useState(null)
  const [signalError, setSignalError] = useState('')
  const [loading, setLoading] = useState(true)
  const [alerting, setAlerting] = useState(false)
  const [signingPetition, setSigningPetition] = useState(false)
  const [petitions, setPetitions] = useState([])
  const [signedPetitionIds, setSignedPetitionIds] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchCurrentUser()
    fetchSignal()
    fetchPetitions()
  }, [id])

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setCurrentUser(data.user || null)
    } catch (e) {
      console.error('Impossible de récupérer l\'utilisateur connecté', e)
    }
  }

  const fetchSignal = async () => {
    setLoading(true)
    setSignalError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/signalements/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const error = new Error(data?.error || 'Impossible de charger le signalement')
        error.status = res.status
        throw error
      }
      if (!data || !data.id) throw new Error('La réponse du serveur ne contient pas le dossier demandé.')
      setSignal(data)
    } catch (e) {
      console.error('[Suivi signalement] Échec du chargement:', e)
      setSignal(null)
      if (e.status === 401) setSignalError('Votre session a expiré. Reconnectez-vous pour consulter ce dossier.')
      else if (e.status === 403) setSignalError('Vous n’avez pas accès à ce dossier. Vérifiez que vous êtes connecté au compte qui l’a créé.')
      else if (e.status === 404) setSignalError('Ce dossier est introuvable dans la base de données actuellement utilisée.')
      else setSignalError('Le serveur n’a pas pu charger ce dossier. Réessayez dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPetitions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/plaidoyers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setPetitions(Array.isArray(data) ? data : [])

      // Verifier quels plaidoyers ont ete signes
      if (token) {
        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          const userId = userData.user?.id || userData.id
          const signedRes = await fetch(`${API_BASE}/api/plaidoyers/signed/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (signedRes.ok) {
            const signedData = await signedRes.json()
            setSignedPetitionIds(Array.isArray(signedData) ? signedData.map(p => p.plaidoyer_id || p.id) : [])
          }
        }
      }
    } catch (e) {
      console.error(e)
      setPetitions([])
    }
  }

  const handleCall = (phone) => {
    if (!phone) return alert('Aucun numero disponible')
    window.location.href = `tel:${phone}`
  }

  const handleSms = (phone) => {
    if (!phone) return alert('Aucun numero disponible')
    window.location.href = `sms:${phone}`
  }

  const handleWhatsApp = (phone) => {
    if (!phone) return alert('Aucun numero disponible')
    // Format simple: remove spaces and +
    const num = phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${num}`, '_blank')
  }

  const handleAlert = async () => {
    if (!signal) return
    setAlerting(true)
    try {
      const res = await fetch(`${API_BASE}/api/signalements/${signal.id}/alert`, { method: 'POST' })
      if (!res.ok) throw new Error('Erreur alerte')
      const data = await res.json()
      alert('Alerte lancee: ' + data.status)
    } catch (e) {
      console.error(e)
      alert('Impossible de lancer l\'alerte')
    } finally {
      setAlerting(false)
    }
  }

  const handleDelete = async () => {
    if (!signal) return
    if (!confirm('Voulez-vous vraiment supprimer ce signalement ?')) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vous devez être connecté pour supprimer ce signalement')
        return
      }

      const res = await fetch(`${API_BASE}/api/signalements/${signal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Erreur suppression')
      }

      alert('Signalement supprimé avec succès')
      router.push(getDashboardPath(currentUser?.role))
    } catch (e) {
      console.error(e)
      alert('Impossible de supprimer le signalement : ' + (e.message || 'Erreur'))
    } finally {
      setDeleting(false)
    }
  }

  const handleSignPetition = async (petitionId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Veuillez vous connecter pour signer un plaidoyer')
      router.push('/login')
      return
    }

    setSigningPetition(true)
    try {
      const res = await fetch(`${API_BASE}/api/plaidoyers/${petitionId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Erreur signature')
      
      // Mettre a jour la liste
      await fetchPetitions()
      alert('Plaidoyer signe avec succes!')
    } catch (e) {
      console.error(e)
      alert('Erreur: ' + (e.message || 'Impossible de signer'))
    } finally {
      setSigningPetition(false)
    }
  }

  if (loading) return (<main className="flex min-h-screen items-center justify-center bg-slate-50 pt-16"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 font-semibold text-slate-600 shadow-sm">Chargement de votre suivi…</div></main>)
  if (!signal) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-16">
      <section role="alert" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl" aria-hidden="true">!</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Suivi du signalement</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Impossible d’ouvrir ce dossier</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{signalError || 'Le dossier demandé n’est pas disponible.'}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={fetchSignal} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Réessayer</button>
          <Link href="/citizen/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Retour à mon espace</Link>
        </div>
      </section>
    </main>
  )

  const collaborators = Array.isArray(signal.collaborators || signal.followers) ? (signal.collaborators || signal.followers) : []
  const policeStatus = signal.policeStatus || {}
  const timeline = [
    { label: 'Signalement envoyé', detail: 'Votre dossier est enregistré sur Signal-Moi.', date: signal.createdAt, done: true },
    { label: 'Réception police', detail: 'La police peut consulter le dossier et la position associée.', date: policeStatus.receivedAt || signal.createdAt, done: true },
    { label: formatStatus(policeStatus.currentStatus || signal.statut), detail: policeStatus.assigned ? 'Un agent est associé au dossier.' : 'Le dossier attend une affectation nominative.', date: policeStatus.lastUpdateAt || signal.updatedAt, done: signal.statut !== 'nouveau' },
    ...(Array.isArray(signal.historique) ? signal.historique.map(item => ({
      label: item.nouveauStatut ? formatStatus(item.nouveauStatut) : (item.action || 'Mise à jour'),
      detail: item.ancienStatut ? `Ancien statut: ${formatStatus(item.ancienStatut)}` : 'Mise à jour du dossier',
      date: item.createdAt,
      done: true
    })) : [])
  ]

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="text-sm text-gray-600 hover:underline">← Retour</button>
            <span className="text-xs text-gray-500">{new Date(signal.createdAt).toLocaleString('fr-FR')}</span>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">{signal.titre}</h1>
            <p className="text-gray-600 mb-4">{signal.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
              <div><strong>Type:</strong> {signal.type}</div>
              <div><strong>Statut:</strong> {formatStatus(signal.statut)}</div>
              <div><strong>Localisation:</strong> {signal.localisation}</div>
              <div><strong>Contact:</strong> {signal.telephone || '—'}</div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Évolution côté police</p>
                <h2 className="mt-2 text-lg font-black text-slate-950">{formatStatus(policeStatus.currentStatus || signal.statut)}</h2>
                <p className="mt-1 text-sm text-slate-700">
                  Dernière mise à jour: {formatDateTime(policeStatus.lastUpdateAt || signal.updatedAt)}
                </p>
                {policeStatus.assignedTo ? (
                  <div className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-700">
                    <p className="font-bold text-slate-950">Agent assigné</p>
                    <p>{[policeStatus.assignedTo.prenom, policeStatus.assignedTo.nom].filter(Boolean).join(' ') || 'Police'}</p>
                    {policeStatus.assignedTo.telephone && <p>Tél: {policeStatus.assignedTo.telephone}</p>}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">
                    Aucun agent nominatif affiché pour le moment, mais le dossier reste visible côté police.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Collaborateurs qui suivent</p>
                <h2 className="mt-2 text-lg font-black text-slate-950">{collaborators.length} collaborateur(s)</h2>
                {collaborators.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {collaborators.map((collab) => (
                      <div key={collab.id || `${collab.email}-${collab.followedAt}`} className="rounded-xl bg-white p-3 text-sm text-slate-700">
                        <p className="font-bold text-slate-950">{[collab.prenom, collab.nom].filter(Boolean).join(' ') || 'Collaborateur'}</p>
                        {collab.email && <p>{collab.email}</p>}
                        {collab.telephone && <p>Tél: {collab.telephone}</p>}
                        <p className="mt-1 text-xs font-semibold text-emerald-700">Suit le dossier depuis {formatDateTime(collab.followedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">
                    Aucun collaborateur n'a encore marqué ce dossier en suivi.
                  </p>
                )}
              </section>
            </div>

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Historique du dossier</p>
              <div className="mt-4 space-y-3">
                {timeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex gap-3">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">{item.label}</p>
                      <p className="text-sm text-slate-600">{item.detail}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatDateTime(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Galerie d'images */}
            {signal.fichiers && signal.fichiers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Preuves jointes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signal.fichiers.map((f, i) => {
                    const fileUrl = f.url
                      ? `${API_BASE}${f.url.startsWith('/') ? f.url : `/${f.url}`}`
                      : `${API_BASE}/${(f.chemin || `uploads/signalements/${f.id}`).replace(/^\/+/, '')}`
                    const isImage = f.type === 'image' || f.mime_type?.startsWith('image/')
                    
                    return (
                      <div key={i} className="border rounded-lg overflow-hidden">
                        {isImage ? (
                          <div className="flex flex-col">
                            <img 
                              src={fileUrl} 
                              alt={f.nom_fichier || f.nom}
                              className="w-full h-64 object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.querySelector('[data-fallback]').style.display = 'flex'
                              }}
                            />
                            <div data-fallback style={{display: 'none'}} className="bg-gray-100 h-64 flex items-center justify-center">
                              <p className="text-gray-500">Impossible de charger l'image</p>
                            </div>
                            <div className="p-2 bg-gray-50 text-sm">
                              <p className="font-medium truncate">{f.nom_fichier || f.nom}</p>
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                Ouvrir en plein écran
                              </a>
                            </div>
                          </div>
                        ) : f.type === 'video' ? (
                          <div className="flex flex-col">
                            <video 
                              controls 
                              className="w-full h-64 bg-black"
                            >
                              <source src={fileUrl} type={f.mime_type} />
                              Votre navigateur ne supporte pas la lecture video
                            </video>
                            <div className="p-2 bg-gray-50 text-sm">
                              <p className="font-medium truncate">{f.nom_fichier || f.nom}</p>
                            </div>
                          </div>
                        ) : f.type === 'audio' ? (
                          <div className="flex flex-col p-3 bg-gray-100">
                            <p className="font-medium mb-2">{f.nom_fichier || f.nom}</p>
                            <audio controls className="w-full">
                              <source src={fileUrl} type={f.mime_type} />
                              Votre navigateur ne supporte pas la lecture audio
                            </audio>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 flex items-center gap-2">
                            <span className="text-2xl">📎</span>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              {f.nom_fichier || f.nom}
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4 mb-4">
              <button onClick={() => handleCall(signal.telephone)} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Appeler</button>
              <button onClick={() => handleWhatsApp(signal.telephone)} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">WhatsApp</button>
              <button onClick={() => handleSms(signal.telephone)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Message</button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={handleAlert} disabled={alerting} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">{alerting ? 'Envoi...' : 'Lancer alerte'}</button>
              <Link href={getDashboardPath(currentUser?.role)}><button className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50">Retour au tableau</button></Link>
              {currentUser && signal.user && currentUser.id === signal.user.id && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-900"
                >
                  {deleting ? 'Suppression...' : 'Supprimer le signalement'}
                </button>
              )}
            </div>
          </div>

          {/* Section Plaidoyers */}
          {petitions.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Plaidoyers a signer</h2>
              <div className="space-y-3">
                {petitions.map((p) => {
                  const isSigned = signedPetitionIds.includes(p.id)
                  return (
                    <div key={p.id} className="border rounded-lg p-4 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{p.titre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                        <div className="mt-2 flex gap-4 text-xs text-gray-500">
                          <span>📊 {p.signatures || 0}/{p.objectif_signatures || '?'} signatures</span>
                          <span>📁 {p.categorie}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSignPetition(p.id)}
                        disabled={signingPetition || isSigned}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${
                          isSigned
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isSigned ? '✓ Déjà signé' : signingPetition ? 'Signature en cours...' : 'Signer ce plaidoyer'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
