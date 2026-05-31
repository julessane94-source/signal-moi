import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../../../components/common/Navbar'
import { API_BASE } from '../../../../config/api'
import { toast } from 'react-toastify'

export default function SignaturesPage() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authenticated, setAuthenticated] = useState([])
  const [anonymous, setAnonymous] = useState([])

  useEffect(() => {
    if (id) fetchSignatures()
  }, [id])

  const fetchSignatures = async () => {
    try {
      const t = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/plaidoyers/${id}/signatures`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      })
      if (!res.ok) {
        if (res.status === 403) setError('Accès refusé')
        else setError('Erreur lors de la récupération des signatures')
        setLoading(false)
        return
      }
      const data = await res.json()
      setAuthenticated(Array.isArray(data.authenticated) ? data.authenticated : [])
      setAnonymous(Array.isArray(data.anonymous) ? data.anonymous : [])
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Type', 'Prénom', 'Nom', 'Email', 'Date']
    const rows = []
    authenticated.forEach(a => {
      rows.push(['auth', a.prenom || '', a.nom || '', a.email || '', a.date_signature ? new Date(a.date_signature).toLocaleString('fr-FR') : ''])
    })
    anonymous.forEach(a => {
      rows.push(['anon', '', a.nom || '', a.email || '', a.date_signature ? new Date(a.date_signature).toLocaleString('fr-FR') : ''])
    })

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signatures_${id}_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Fichier téléchargé')
  }

  const copyEmails = () => {
    const emails = [...authenticated.map(a => a.email), ...anonymous.map(a => a.email)].filter(Boolean).join('; ')
    navigator.clipboard.writeText(emails)
    toast.success('Adresses copiées')
  }

  if (loading) return (<><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div></>)

  if (error) return (<><Navbar /><div className="min-h-screen pt-20"><div className="max-w-4xl mx-auto px-4"><div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700">{error}</div></div></div></>)

  return (
    <>
      <Head>
        <title>Signatures</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <button onClick={() => router.back()} className="text-green-600 hover:text-green-700">← Retour</button>
              <h1 className="text-2xl font-bold mt-2">Signataires</h1>
              <p className="text-sm text-gray-600">{authenticated.length} authentifiés • {anonymous.length} anonymes</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-2 rounded">📥 Exporter CSV</button>
              <button onClick={copyEmails} className="bg-blue-600 text-white px-3 py-2 rounded">📋 Copier emails</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-4">Authentifiés</h3>
              {authenticated.length === 0 ? <div className="text-gray-500">Aucun signataire authentifié</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b"><tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr></thead>
                    <tbody>
                      {authenticated.map((a, idx) => (
                        <tr key={a.id || idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{idx+1}</td>
                          <td className="px-4 py-3">{a.prenom} {a.nom}</td>
                          <td className="px-4 py-3"><a className="text-blue-600 hover:underline" href={`mailto:${a.email}`}>{a.email || '—'}</a></td>
                          <td className="px-4 py-3">{a.date_signature ? new Date(a.date_signature).toLocaleString('fr-FR') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-4">Anonymes</h3>
              {anonymous.length === 0 ? <div className="text-gray-500">Aucune signature anonyme</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b"><tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr></thead>
                    <tbody>
                      {anonymous.map((a, idx) => (
                        <tr key={a.id || idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{idx+1}</td>
                          <td className="px-4 py-3">{a.nom || '—'}</td>
                          <td className="px-4 py-3"><a className="text-blue-600 hover:underline" href={`mailto:${a.email}`}>{a.email || '—'}</a></td>
                          <td className="px-4 py-3">{a.date_signature ? new Date(a.date_signature).toLocaleString('fr-FR') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
