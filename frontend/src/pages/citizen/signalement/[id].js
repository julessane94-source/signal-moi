import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../../../components/common/Navbar'
import Link from 'next/link'

export default function SignalementDetail() {
  const router = useRouter()
  const { id } = router.query
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alerting, setAlerting] = useState(false)
  const [signingPetition, setSigningPetition] = useState(false)
  const [petitions, setPetitions] = useState([])
  const [signedPetitionIds, setSignedPetitionIds] = useState([])

  useEffect(() => {
    if (!id) return
    fetchSignal()
    fetchPetitions()
  }, [id])

  const fetchSignal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signalements/${id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setSignal(data)
    } catch (e) {
      console.error(e)
      setSignal(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchPetitions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plaidoyers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setPetitions(Array.isArray(data) ? data : [])

      // Verifier quels plaidoyers ont ete signes
      if (token) {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          const signedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plaidoyers/signed/user/${userData.id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signalements/${signal.id}/alert`, { method: 'POST' })
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

  const handleSignPetition = async (petitionId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Veuillez vous connecter pour signer un plaidoyer')
      router.push('/login')
      return
    }

    setSigningPetition(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plaidoyers/${petitionId}/sign`, {
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

  if (loading) return (<><Navbar /><div className="min-h-screen pt-16 flex items-center justify-center">Chargement...</div></>)
  if (!signal) return (<><Navbar /><div className="min-h-screen pt-16 flex items-center justify-center">Signalement introuvable</div></>)

  return (
    <>
      <Navbar />
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
              <div><strong>Statut:</strong> {signal.statut}</div>
              <div><strong>Localisation:</strong> {signal.localisation}</div>
              <div><strong>Contact:</strong> {signal.telephone || '—'}</div>
            </div>

            {/* Galerie d'images */}
            {signal.fichiers && signal.fichiers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Preuves jointes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signal.fichiers.map((f, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      {f.type === 'image' ? (
                        <div className="flex flex-col">
                          <img 
                            src={f.url} 
                            alt={f.nom}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.querySelector('[data-fallback]').style.display = 'flex'
                            }}
                          />
                          <div data-fallback style={{display: 'none'}} className="bg-gray-100 h-64 items-center justify-center">
                            <p className="text-gray-500">Impossible de charger l'image</p>
                          </div>
                          <div className="p-2 bg-gray-50 text-sm">
                            <p className="font-medium truncate">{f.nom}</p>
                            <a 
                              href={f.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Ouvrir en plein ecran
                            </a>
                          </div>
                        </div>
                      ) : f.type === 'video' ? (
                        <div className="flex flex-col">
                          <video 
                            controls 
                            className="w-full h-64 bg-black"
                          >
                            <source src={f.url} type={f.mimeType} />
                            Votre navigateur ne supporte pas la lecture video
                          </video>
                          <div className="p-2 bg-gray-50 text-sm">
                            <p className="font-medium truncate">{f.nom}</p>
                          </div>
                        </div>
                      ) : f.type === 'audio' ? (
                        <div className="flex flex-col p-3 bg-gray-100">
                          <p className="font-medium mb-2">{f.nom}</p>
                          <audio controls className="w-full">
                            <source src={f.url} type={f.mimeType} />
                            Votre navigateur ne supporte pas la lecture audio
                          </audio>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 flex items-center gap-2">
                          <span className="text-2xl">📎</span>
                          <a 
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {f.nom}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4 mb-4">
              <button onClick={() => handleCall(signal.telephone)} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Appeler</button>
              <button onClick={() => handleWhatsApp(signal.telephone)} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">WhatsApp</button>
              <button onClick={() => handleSms(signal.telephone)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Message</button>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAlert} disabled={alerting} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">{alerting ? 'Envoi...' : 'Lancer alerte'}</button>
              <Link href="/citizen/dashboard"><button className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50">Retour au tableau</button></Link>
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
                        className={`px-4 py-2 rounded font-medium whitespace-nowrap ${
                          isSigned
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isSigned ? '✓ Signe' : signingPetition ? 'Signature...' : '✍️ Signer'}
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
