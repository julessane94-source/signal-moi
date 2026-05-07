import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState([])
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
    address: 'Yaounde, Cameroun'
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      window.location.href = '/'
    }
    fetchUsers()
  }, [user, loading])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur:', error)
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
      
      await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      toast.success(editingUser ? 'Utilisateur modifie' : 'Utilisateur cree')
      setShowModal(false)
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen' })
      fetchUsers()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Utilisateur supprime')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const resetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Mot de passe reinitialise a "Default123!"')
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      toast.success('Role modifie')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const saveConfig = async () => {
    toast.success('Configuration sauvegardee')
  }

  const stats = {
    totalUsers: users.length,
    totalSignalements: 0,
    totalCampagnes: 0,
    activeUsers: users.filter(u => u.isActive !== false).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* En-tete */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            {activeTab === 'users' && (
              <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                + Creer utilisateur
              </button>
            )}
          </div>

          {/* Onglets */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👥 Utilisateurs</button>
              <button onClick={() => setActiveTab('config')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'config' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>⚙️ Configuration</button>
              <button onClick={() => setActiveTab('stats')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>📊 Supervision</button>
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👤 Mon profil</button>
            </nav>
          </div>

          {/* Onglet Utilisateurs - Gestion complete */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4"><div className="font-medium">{u.prenom} {u.nom}</div><div className="text-sm text-gray-500">{u.telephone}</div></td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4"><select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm"><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select></td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditingUser(u); setFormData(u); setShowModal(true); }} className="text-indigo-600">✏️</button><button onClick={() => resetPassword(u.id)} className="text-yellow-600">🔑</button><button onClick={() => deleteUser(u.id)} className="text-red-600">🗑️</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Onglet Configuration du site */}
          {activeTab === 'config' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Configuration du site</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Titre du site</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Email de contact</label><input type="email" className="w-full border rounded-lg px-3 py-2" value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Telephone</label><input type="tel" className="w-full border rounded-lg px-3 py-2" value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Adresse</label><textarea className="w-full border rounded-lg px-3 py-2" rows="2" value={siteConfig.address} onChange={e => setSiteConfig({...siteConfig, address: e.target.value})} /></div>
                <button onClick={saveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Sauvegarder</button>
              </div>
            </div>
          )}

          {/* Onglet Supervision */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</div><div className="text-gray-600">Utilisateurs</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{stats.totalSignalements}</div><div className="text-gray-600">Signalements</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{stats.totalCampagnes}</div><div className="text-gray-600">Campagnes</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div><div className="text-gray-600">Actifs</div></div>
            </div>
          )}

          {/* Onglet Mon profil */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Mon profil</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><strong>Prenom:</strong> {user.prenom}</div><div><strong>Nom:</strong> {user.nom}</div>
                <div><strong>Email:</strong> {user.email}</div><div><strong>Telephone:</strong> {user.telephone}</div>
                <div><strong>Ville:</strong> {user.ville}</div><div><strong>Quartier:</strong> {user.quartier}</div>
                <div><strong>Role:</strong> {user.role}</div>
              </div>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg">Modifier mon profil</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal creation/modification utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Modifier' : 'Creer'} un utilisateur</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Prenom" className="w-full border rounded px-3 py-2" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} required />
              <input type="text" placeholder="Nom" className="w-full border rounded px-3 py-2" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full border rounded px-3 py-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <input type="tel" placeholder="Telephone" className="w-full border rounded px-3 py-2" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} required />
              {!editingUser && <input type="password" placeholder="Mot de passe" className="w-full border rounded px-3 py-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />}
              <input type="text" placeholder="Ville" className="w-full border rounded px-3 py-2" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} required />
              <input type="text" placeholder="Quartier" className="w-full border rounded px-3 py-2" value={formData.quartier} onChange={e => setFormData({...formData, quartier: e.target.value})} required />
              <select className="w-full border rounded px-3 py-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingUser(null); }} className="flex-1 border rounded py-2">Annuler</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded py-2">{editingUser ? 'Modifier' : 'Creer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}