import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../../components/common/Navbar'
import { API_BASE } from '../../../config/api'
import { toast } from 'react-toastify'

export default function CampagneInscrits() {
  const router = useRouter()
  const { id } = router.query
  const [campagne, setCampagne] = useState(null)
  const [inscrits, setInscrits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    setToken(t || '')
    
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    if (!id) return

    try {
      const t = localStorage.getItem('token')
      
      // Récupérer les détails de la campagne
      const campRes = await fetch(
        `${API_BASE}/api/campagnes/${id}`,
        {
          headers: t ? { Authorization: `Bearer ${t}` } : {}
        }
      )
      
      if (!campRes.ok) {
        setError('Campagne non trouvée')
        setLoading(false)
        return
      }

      const campData = await campRes.json()
      setCampagne(campData)

      // Récupérer la liste des inscrits
      const inscRes = await fetch(
        `${API_BASE}/api/campagnes/${id}/inscrits`,
        {
          headers: t ? { Authorization: `Bearer ${t}` } : {}
        }
      )

      if (inscRes.ok) {
        const inscData = await inscRes.json()
        setInscrits(Array.isArray(inscData) ? inscData : [])
      } else if (inscRes.status === 403) {
        setError('Vous n\'avez pas accès à cette liste')
      }

      setLoading(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement')
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!campagne || !inscrits.length) return

    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Date inscription']
    const rows = inscrits.map(i => [
      i.user?.prenom || '',
      i.user?.nom || '',
      i.user?.email || '',
      i.user?.telephone || '',
      i.dateInscription ? new Date(i.dateInscription).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscrits_${campagne.titre}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast.success('Fichier téléchargé!')
  }

  const copyEmailsToClipboard = () => {
    const emails = inscrits
      .map(i => i.user?.email)
      .filter(Boolean)
      .join('; ')

    navigator.clipboard.writeText(emails)
    toast.success(`${inscrits.length} adresses copiées!`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    )
  }

  if (!campagne) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700">
              {error || 'Campagne non trouvée'}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Inscrits - {campagne.titre}</title>
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-green-600 hover:text-green-700 font-semibold"
            >
              ← Retour
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {campagne.titre}
            </h1>
            <p className="text-gray-600">
              {inscrits.length} inscrit{inscrits.length !== 1 ? 's' : ''} sur {campagne.capacite_max}
            </p>
          </div>

          {/* Actions */}
          <div className="mb-6 flex gap-3 flex-wrap">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              📥 Exporter CSV
            </button>
            <button
              onClick={copyEmailsToClipboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              📋 Copier les emails
            </button>
          </div>

          {/* Tableau des inscrits */}
          {inscrits.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Téléphone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscrits.map((inscrit, idx) => (
                      <tr key={inscrit.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {inscrit.user?.prenom} {inscrit.user?.nom}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <a
                            href={`mailto:${inscrit.user?.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {inscrit.user?.email || '—'}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {inscrit.user?.telephone ? (
                            <a
                              href={`tel:${inscrit.user.telephone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {inscrit.user.telephone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(inscrit.dateInscription).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">Aucun inscrit pour le moment</p>
            </div>
          )}

          {/* Infos campagne */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Détails de la campagne</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="font-medium text-gray-900">{campagne.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Lieu</div>
                  <div className="font-medium text-gray-900">{campagne.lieu}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Dates</div>
                  <div className="font-medium text-gray-900">
                    {new Date(campagne.date_debut).toLocaleDateString('fr-FR')} -{' '}
                    {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Capacité</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Inscrits</span>
                  <span className="font-semibold text-gray-900">
                    {inscrits.length} / {campagne.capacite_max}
                  </span>
                </div>
                <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-full transition-all"
                    style={{
                      width: `${(inscrits.length / campagne.capacite_max) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {campagne.capacite_max - inscrits.length} place{campagne.capacite_max - inscrits.length !== 1 ? 's' : ''} disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
