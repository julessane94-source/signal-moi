'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (['collaborateur', 'collaborator'].includes(value)) return 'collaborateur'
  if (['admin', 'administrateur'].includes(value)) return 'admin'
  return value
}
const TYPE_ICONS = {
  violence: '🔴',
  vol: '🎒',
  probleme_eclairage: '💡',
  nid_de_poule: '⛳',
  incendie: '🔥',
  accident: '🚗',
  bruit: '🔊',
  autre: '❓'
}

export default function CollaboratorStatistics() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [logo, setLogo] = useState(null)
  const [company, setCompany] = useState({ name: 'Signal-Moi', address: 'Dakar, Sénégal' })

  useEffect(() => {
    if (authLoading) return
    const role = normalizeRole(user?.role)
    if (!user || role !== 'collaborateur') {
      toast.error('Acces refuse')
      setLoading(false)
      return
    }
    fetchStatistics()
    fetchConfig()
  }, [user, authLoading])

  const fetchConfig = async () => {
    try {
      // Récupérer le logo et config depuis la BD (logo déjà en format data:image/...;base64,...)
      const configRes = await fetch(`${API_BASE}/api/auth/site-config`)
      if (configRes.ok) {
        const config = await configRes.json()
        if (config.logoUrl) {
          setLogo(config.logoUrl) // Déjà en format data:image/...;base64,...
        }
        setCompany({
          name: config.siteName || 'Signal-Moi',
          address: config.address || 'Dakar, Sénégal'
        })
      }
    } catch (err) {
      console.warn('⚠️  Erreur lors du chargement de la config:', err)
    }
  }

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        toast.error('❌ Auth token manquant — veuillez vous reconnecter')
        setLoading(false)
        return
      }

      const fetchOpts = {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
      }
      const apiGet = async (url) => {
        const response = await fetch(url, fetchOpts)
        const payload = await response.json()
        if (!response.ok || payload.error) {
          throw new Error(payload.error || 'Erreur API statistiques')
        }
        return payload
      }

      const [overview, byType, byGender, byAge] = await Promise.all([
        apiGet(`${API_BASE}/api/statistics/overview`),
        apiGet(`${API_BASE}/api/statistics/by-type`),
        apiGet(`${API_BASE}/api/statistics/by-gender`),
        apiGet(`${API_BASE}/api/statistics/by-age`)
      ])

      setData({
        overview: overview,
        byType: byType.data || [],
        byGender: byGender.data || [],
        byAge: byAge.data || []
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('statistics-report')
      if (!element) return

      toast.info('📊 Génération du PDF...')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Statistiques_Collaborateur_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('✅ PDF téléchargé avec succès!')
    } catch (error) {
      console.error('Erreur PDF:', error)
      toast.error('❌ Erreur lors de la génération du PDF')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || normalizeRole(user.role) !== 'collaborateur') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
          <p className="text-gray-600">Seuls les collaborateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Mes Statistiques - Signal-Moi</title>
        <meta name="description" content="Mes statistiques de signalements" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Mes Statistiques</h1>
            <p className="text-gray-600">Analyse des signalements par type, sexe et âge</p>
          </div>

          {/* Bouton de téléchargement */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              onClick={downloadPDF}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 hover:shadow-lg"
            >
              📥 Télécharger le rapport PDF
            </button>
          </div>

          {/* Rapport */}
          <div id="statistics-report" className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {/* Logo et titre */}
            <div className="border-b-2 border-indigo-600 pb-6">
              <div className="flex items-center gap-4 mb-4">
                {logo && (
                  <img src={logo} alt="Logo" className="h-12 w-12 object-contain rounded" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                  <p className="text-sm text-gray-600">{company.address}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Rapport généré: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : data ? (
              <>
                {/* Statistiques globales */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Vue d'ensemble</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-3xl font-bold text-indigo-600">{data.overview?.totalSignalements || 0}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-sm text-gray-600">Traités</p>
                      <p className="text-3xl font-bold text-emerald-600">{data.overview?.statusDistribution?.find(s => s.statut === 'traite')?.count || 0}</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-sm text-gray-600">En cours</p>
                      <p className="text-3xl font-bold text-amber-600">{data.overview?.statusDistribution?.find(s => s.statut === 'en_cours')?.count || 0}</p>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                      <p className="text-sm text-gray-600">Urgents</p>
                      <p className="text-3xl font-bold text-rose-600">{data.overview?.priorityDistribution?.find(p => p.priorite === 'urgente')?.count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Graphique par type */}
                {data.byType.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Signalements par type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Graphique par sexe */}
                {data.byGender.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Répartition par sexe</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.byGender}
                          dataKey="count"
                          nameKey="genre"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {data.byGender.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Graphique par âge */}
                {data.byAge.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🎂 Répartition par âge</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byAge}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age_group" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t-2 border-gray-200 pt-6 text-xs text-gray-500">
                  <p>Rapport confidentiel - Réservé aux collaborateurs</p>
                  <p>© {new Date().getFullYear()} Signal-Moi. Tous droits réservés.</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}
