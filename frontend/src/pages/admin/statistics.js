'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
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

export default function Statistics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [exportData, setExportData] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  })
  const [logo, setLogo] = useState(null)
  const [company, setCompany] = useState({ name: 'Signal-Moi', address: 'Dakar, Sénégal' })

  useEffect(() => {
    if (!user || !['admin', 'collaborateur'].includes(user.role)) {
      toast.error('❌ Accès refusé')
      return
    }
    fetchStatistics()
    fetchConfig()
  }, [user, filters])

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

      const [overview, byType, byMonth, byGender, byAge, exportDat] = await Promise.all([
        apiGet(`${API_BASE}/api/statistics/overview`),
        apiGet(`${API_BASE}/api/statistics/by-type`),
        apiGet(`${API_BASE}/api/statistics/by-month?year=${new Date().getFullYear()}`),
        apiGet(`${API_BASE}/api/statistics/by-gender`),
        apiGet(`${API_BASE}/api/statistics/by-age`),
        apiGet(`${API_BASE}/api/statistics/export-data?startDate=${filters.startDate}&endDate=${filters.endDate}&type=${filters.type}`)
      ])

      setData({
        overview: overview,
        byType: byType.data || [],
        byMonth: byMonth.data || [],
        byGender: byGender.data || [],
        byAge: byAge.data || []
      })
      setExportData({ ...(exportDat.stats || {}), signalements: exportDat.signalements || [] })
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

      pdf.save(`Statistiques_Signal-Moi_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('✅ PDF téléchargé avec succès!')
    } catch (error) {
      console.error('Erreur PDF:', error)
      toast.error('❌ Erreur lors de la génération du PDF')
    }
  }

  if (!user || !['admin', 'collaborateur'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
          <p className="text-gray-600">Seuls les administrateurs et collaborateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Statistiques - Signal-Moi Admin</title>
        <meta name="description" content="Statistiques détaillées des signalements" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Statistiques des Signalements</h1>
            <p className="text-gray-600">Analyse complète par type, mois, sexe et âge</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de signalement</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="all">Tous les types</option>
                  {Object.entries(TYPE_ICONS).map(([key]) => (
                    <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={downloadPDF}
                  className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white transition hover:bg-indigo-700 hover:shadow-lg"
                >
                  📥 Télécharger PDF
                </button>
              </div>
            </div>
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
                      <p className="text-sm text-gray-600">Total de signalements</p>
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
                    <table className="w-full mt-4 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-right">Nombre</th>
                          <th className="px-4 py-2 text-right">Pourcentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byType.map((t, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-2">{TYPE_ICONS[t.type] || '❓'} {t.type}</td>
                            <td className="px-4 py-2 text-right">{t.count}</td>
                            <td className="px-4 py-2 text-right">
                              {data.overview?.totalSignalements ? ((t.count / data.overview.totalSignalements) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Graphique par mois */}
                {data.byMonth.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Tendance mensuelle</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} />
                      </LineChart>
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

                {/* Tableau détaillé */}
                {exportData?.signalements && exportData.signalements.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📄 Liste détaillée</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Titre</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Statut</th>
                            <th className="px-4 py-2 text-left">Déclarant</th>
                            <th className="px-4 py-2 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exportData.signalements.slice(0, 10).map((s, i) => (
                            <tr key={i} className="border-b">
                              <td className="px-4 py-2 font-medium">{s.titre}</td>
                              <td className="px-4 py-2">{TYPE_ICONS[s.type] || '❓'} {s.type}</td>
                              <td className="px-4 py-2">{s.statut}</td>
                              <td className="px-4 py-2">{s.userName}</td>
                              <td className="px-4 py-2">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {exportData.signalements.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2">... et {exportData.signalements.length - 10} autres signalements</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t-2 border-gray-200 pt-6 text-xs text-gray-500">
                  <p>Rapport confidentiel - Réservé aux administrateurs et collaborateurs</p>
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
