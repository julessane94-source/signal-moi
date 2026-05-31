import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../../components/common/Navbar'
import { API_BASE } from '../../config/api'

export default function PlaidoyerDetail() {
  const router = useRouter()
  const { id } = router.query
  const [plaidoyer, setPlaidoyer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchPlaidoyer()
  }, [id])

  const fetchPlaidoyer = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/plaidoyers/${id}`)
      if (!res.ok) {
        throw new Error('Plaidoyer non trouvé')
      }
      const data = await res.json()
      setPlaidoyer(data)
      setError('')
    } catch (err) {
      console.error('Erreur fetch plaidoyer:', err)
      setError('Impossible de charger le plaidoyer')
      setPlaidoyer(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  if (error || !plaidoyer) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">⚠️ {error || 'Plaidoyer introuvable'}</h1>
            <Link href="/plaidoyers">
              <a className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700">
                Retour aux plaidoyers
              </a>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-6">
            <Link href="/plaidoyers">
              <a className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">← Retour aux plaidoyers</a>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{plaidoyer.titre}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1">{plaidoyer.categorie || 'Sans catégorie'}</span>
                  <span>🎯 Objectif&nbsp;: {plaidoyer.objectif_signatures || '—'}</span>
                  <span>🖊️ Signatures&nbsp;: {plaidoyer.nombre_signatures_total || 0}</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 mb-8">
                <p>{plaidoyer.description}</p>
              </div>

              {plaidoyer.contenu && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Détails</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{plaidoyer.contenu}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">Signatures authentifiées</p>
                  <p>{plaidoyer.nombre_signatures_auth || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">Signatures anonymes</p>
                  <p>{plaidoyer.nombre_signatures_anonymes || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">Publié le</p>
                  <p>{plaidoyer.created_at ? new Date(plaidoyer.created_at).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">Dernière mise à jour</p>
                  <p>{plaidoyer.updated_at ? new Date(plaidoyer.updated_at).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
