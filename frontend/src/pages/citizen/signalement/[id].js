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

  useEffect(() => {
    if (!id) return
    fetchSignal()
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

  const handleCall = (phone) => {
    if (!phone) return alert('Aucun numéro disponible')
    window.location.href = `tel:${phone}`
  }

  const handleSms = (phone) => {
    if (!phone) return alert('Aucun numéro disponible')
    window.location.href = `sms:${phone}`
  }

  const handleWhatsApp = (phone) => {
    if (!phone) return alert('Aucun numéro disponible')
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
      alert('Alerte lancée: ' + data.status)
    } catch (e) {
      console.error(e)
      alert('Impossible de lancer l\'alerte')
    } finally {
      setAlerting(false)
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">{signal.titre}</h1>
            <p className="text-gray-600 mb-4">{signal.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-700">
              <div><strong>Type:</strong> {signal.type}</div>
              <div><strong>Statut:</strong> {signal.statut}</div>
              <div><strong>Localisation:</strong> {signal.localisation}</div>
              <div><strong>Contact:</strong> {signal.telephone || '—'}</div>
            </div>

            {signal.fichiers && signal.fichiers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Fichiers</h3>
                <ul className="space-y-2">
                  {signal.fichiers.map((f, i) => (
                    <li key={i}><a className="text-indigo-600 hover:underline" href={f.url} target="_blank" rel="noreferrer">{f.nom || ('Fichier ' + (i+1))}</a></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => handleCall(signal.telephone)} className="flex-1 bg-green-600 text-white py-2 rounded">Appeler</button>
              <button onClick={() => handleWhatsApp(signal.telephone)} className="flex-1 bg-green-500 text-white py-2 rounded">WhatsApp</button>
              <button onClick={() => handleSms(signal.telephone)} className="flex-1 bg-blue-600 text-white py-2 rounded">Message</button>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleAlert} disabled={alerting} className="flex-1 bg-red-600 text-white py-2 rounded">{alerting ? 'Envoi...' : 'Lancer alerte'}</button>
              <Link href="/citizen/dashboard"><button className="flex-1 border border-gray-300 py-2 rounded">Retour au tableau</button></Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
