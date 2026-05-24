import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [plaidoyers, setPlaidoyers] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen'
  })
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Signal-Moi',
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+237 600 000 000',
    address: 'Yaounde, Cameroun',
    contactPage: {
      title: 'Contactez-nous',
      content: 'Pour toute question, contactez-nous.',
      images: [],
      videos: []
    },
    aboutPage: {
      title: 'A propos',
      content: 'Signal-Moi est une plateforme...',
      images: [],
      videos: []
    },
    homePage: {
      title: 'Accueil',
      heroText: 'Votre voix compte',
      content: 'Bienvenue sur Signal-Moi',
      images: [],
      videos: []
    }
  })
  
  const [signalements, setSignalements] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSignalements: 0,
    totalCampagnes: 0,
    totalPlaidoyers: 0,
    activeUsers: 0
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'Admin'))) {
      window.location.href = '/'
    }
    if (!loading && (user?.role === 'admin' || user?.role === 'Admin')) {
      fetchUsers()
      fetchSiteConfig()
      fetchStats()
    }
  }, [user, loading])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors du chargement des utilisateurs')
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur fetchUsers:', error)
      toast.error('Erreur: ' + error.message)
    }
  }

  const fetchSiteConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/site-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSiteConfig(prev => ({
          ...prev,
          siteName: data.siteName || prev.siteName,
          contactEmail: data.contactEmail || prev.contactEmail,
          contactPhone: data.contactPhone || prev.contactPhone,
          address: data.address || prev.address,
          contactPage: data.contact_page || data.contactPage || prev.contactPage,
          aboutPage: data.about_page || data.aboutPage || prev.aboutPage,
          homePage: data.home_page || data.homePage || prev.homePage
        }))
      }
    } catch (error) {
      console.error('Erreur fetchSiteConfig:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const [signalementsRes, campagnesRes, plaidoyersRes] = await Promise.all([
        fetch(`${base}/api/admin/signalements`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${base}/api/admin/campagnes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${base}/api/admin/plaidoyers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const signalementsData = signalementsRes.ok ? await signalementsRes.json() : []
      const campagnesData = campagnesRes.ok ? await campagnesRes.json() : []
      const plaidoyersData = plaidoyersRes.ok ? await plaidoyersRes.json() : []
      
      setSignalements(Array.isArray(signalementsData) ? signalementsData : [])
      setCampagnes(Array.isArray(campagnesData) ? campagnesData : [])
      setPlaidoyers(Array.isArray(plaidoyersData) ? plaidoyersData : [])
      
      setStats(prev => ({
        ...prev,
        totalSignalements: Array.isArray(signalementsData) ? signalementsData.length : 0,
        totalCampagnes: Array.isArray(campagnesData) ? campagnesData.length : 0,
        totalPlaidoyers: Array.isArray(plaidoyersData) ? plaidoyersData.length : 0
      }))
    } catch (error) {
      console.error('Erreur fetchStats:', error)
      toast.error('Erreur lors du chargement des données')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const url = editingUser 
        ? `${base}/api/admin/users/${editingUser.id}`
        : `${base}/api/admin/users`
      const method = editingUser ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || 'Erreur lors de la création')
      }
      toast.success(editingUser ? 'Utilisateur modifié' : 'Utilisateur créé')
      setShowModal(false)
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen' })
      fetchUsers()
    } catch (error) {
      toast.error(error.message || 'Erreur')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur de suppression')
      toast.success('Utilisateur supprimé')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const resetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Mot de passe réinitialisé à "Default123!"')
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Rôle modifié')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const saveConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const payload = {
        siteName: siteConfig.siteName,
        contactEmail: siteConfig.contactEmail,
        contactPhone: siteConfig.contactPhone,
        address: siteConfig.address,
        contactPage: siteConfig.contactPage,
        aboutPage: siteConfig.aboutPage,
        homePage: siteConfig.homePage
      }

      const res = await fetch(`${base}/api/admin/site-config`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      toast.success('Configuration sauvegardée')
    } catch (error) {
      toast.error(error.message || 'Erreur')
    }
  }

  const statsData = {
    totalUsers: users.length,
    totalSignalements: stats.totalSignalements,
    totalCampagnes: stats.totalCampagnes,
    totalPlaidoyers: stats.totalPlaidoyers,
    activeUsers: users.filter(u => u.is_active !== false).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'Admin')) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            {activeTab === 'users' && (
              <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                + Créer utilisateur
              </button>
            )}
          </div>

          {/* Onglets */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8 overflow-x-auto">
              <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👥 Utilisateurs</button>
              <button onClick={() => setActiveTab('signalements')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'signalements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>📋 Signalements</button>
              <button onClick={() => setActiveTab('campagnes')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'campagnes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>🎯 Campagnes</button>
              <button onClick={() => setActiveTab('plaidoyers')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'plaidoyers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>✍️ Plaidoyers</button>
              <button onClick={() => setActiveTab('stats')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>📊 Stats</button>
              <button onClick={() => setActiveTab('config')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'config' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>⚙️ Config</button>
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👤 Profil</button>
            </nav>
          </div>

          {/* Onglet Utilisateurs */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {users.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-500">Aucun utilisateur</p></div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4"><div className="font-medium">{u.prenom} {u.nom}</div><div className="text-sm text-gray-500">{u.telephone}</div></td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4"><select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm"><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select></td>
                        <td className="px-6 py-4 flex gap-2"><button onClick={() => { setEditingUser(u); setFormData(u); setShowModal(true); }} className="text-indigo-600 text-sm">✏️ Éditer</button><button onClick={() => resetPassword(u.id)} className="text-blue-600 text-sm">🔑 Reset</button><button onClick={() => deleteUser(u.id)} className="text-red-600 text-sm">🗑️ Supprimer</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Onglet Signalements */}
          {activeTab === 'signalements' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Signalements ({signalements.length})</h2>
              {signalements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500">Aucun signalement</p></div>
              ) : (
                <div className="space-y-4">
                  {signalements.map(s => (
                    <div key={s.id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{s.titre}</h3>
                          <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                          <div className="text-sm text-gray-500 mt-2">Par: {s.author?.prenom} {s.author?.nom} | 📍 {s.localisation}</div>
                        </div>
                        <div className="text-right"><span className="text-sm font-medium">{s.statut}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Campagnes */}
          {activeTab === 'campagnes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Campagnes ({campagnes.length})</h2>
              {campagnes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500">Aucune campagne</p></div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {campagnes.map(c => (
                    <div key={c.id} className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="font-semibold">{c.titre}</h3>
                      <p className="text-gray-600 text-sm mt-1">{c.description}</p>
                      <div className="text-xs text-gray-500 mt-2">👥 {c.participants || 0} participants | 📍 {c.lieu}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Plaidoyers */}
          {activeTab === 'plaidoyers' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Plaidoyers ({plaidoyers.length})</h2>
              {plaidoyers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500">Aucun plaidoyer</p></div>
              ) : (
                <div className="space-y-4">
                  {plaidoyers.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{p.titre}</h3>
                          <p className="text-gray-600 text-sm mt-1">{p.description}</p>
                          <div className="text-xs text-gray-500 mt-2">📊 {p.signatures || 0} / {p.targetSignatures || '∞'} signatures</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Stats */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalUsers}</div><div className="text-gray-600 text-sm">Utilisateurs</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalSignalements}</div><div className="text-gray-600 text-sm">Signalements</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalCampagnes}</div><div className="text-gray-600 text-sm">Campagnes</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalPlaidoyers}</div><div className="text-gray-600 text-sm">Plaidoyers</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-green-600">{statsData.activeUsers}</div><div className="text-gray-600 text-sm">Actifs</div></div>
            </div>
          )}

          {/* Onglet Config */}
          {activeTab === 'config' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Configuration du site</h2>
              <div className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" className="w-full border rounded px-3 py-2" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" className="w-full border rounded px-3 py-2" value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="tel" className="w-full border rounded px-3 py-2" value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Adresse</label><textarea className="w-full border rounded px-3 py-2" rows="2" value={siteConfig.address} onChange={e => setSiteConfig({...siteConfig, address: e.target.value})} /></div>
                <button onClick={saveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Sauvegarder</button>
              </div>
            </div>
          )}

          {/* Onglet Profil */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Mon profil</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><strong>Prénom:</strong> {user.prenom}</div><div><strong>Nom:</strong> {user.nom}</div>
                <div><strong>Email:</strong> {user.email}</div><div><strong>Téléphone:</strong> {user.telephone}</div>
                <div><strong>Ville:</strong> {user.ville}</div><div><strong>Quartier:</strong> {user.quartier}</div>
                <div><strong>Rôle:</strong> {user.role}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal création/modification utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Modifier' : 'Créer'} un utilisateur</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Prénom" className="w-full border rounded px-3 py-2" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} required />
              <input type="text" placeholder="Nom" className="w-full border rounded px-3 py-2" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full border rounded px-3 py-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <input type="tel" placeholder="Téléphone" className="w-full border rounded px-3 py-2" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
              {!editingUser && <input type="password" placeholder="Mot de passe" className="w-full border rounded px-3 py-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />}
              <input type="text" placeholder="Ville" className="w-full border rounded px-3 py-2" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} required />
              <input type="text" placeholder="Quartier" className="w-full border rounded px-3 py-2" value={formData.quartier} onChange={e => setFormData({...formData, quartier: e.target.value})} />
              <select className="w-full border rounded px-3 py-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingUser(null); }} className="flex-1 border rounded py-2">Annuler</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded py-2">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
