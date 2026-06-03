'use client'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import ErrorBoundary from '../components/common/ErrorBoundary'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../config/api'

export default function Contact() {
  const [siteConfig, setSiteConfig] = useState({
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+221 77 88516 91',
    address: 'Dakar, Sénégal',
    country: 'SN',
    contactPage: { 
      title: 'Contactez-nous', 
      content: 'Pour toute question ou suggestion, n\'hésitez pas à nous contacter. Notre équipe est disponible pour vous aider.',
      images: [], 
      videos: [] 
    }
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    detectLocation()
    fetchConfig()
  }, [])

  const detectLocation = () => {
    // Détecte le pays/fuseau horaire automatiquement
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      // Mapper les fuseaux horaires aux pays
      const timezoneToCountry = {
        'Africa/Dakar': 'SN',
        'Africa/Abidjan': 'CI',
        'Africa/Lagos': 'NG',
        'Africa/Douala': 'CM',
        'Africa/Kinshasa': 'CD',
        'Africa/Bangui': 'CF',
        'Africa/Accra': 'GH'
      }

      const detectedCountry = timezoneToCountry[timezone] || 'SN'
      
      // Configurer les infos selon le pays détecté
      const countryConfigs = {
        SN: {
          contactEmail: 'contact@signal-moi.com',
          contactPhone: '+221 77 88516 91',
          address: 'Dakar, Sénégal',
          country: 'SN'
        },
        CM: {
          contactEmail: 'contact@signal-moi.com',
          contactPhone: '+237 77 88516 91',
          address: 'Yaoundé, Cameroun',
          country: 'CM'
        },
        CI: {
          contactEmail: 'contact@signal-moi.com',
          contactPhone: '+225 77 88516 91',
          address: 'Abidjan, Côte d\'Ivoire',
          country: 'CI'
        }
      }

      const config = countryConfigs[detectedCountry] || countryConfigs.SN
      setSiteConfig(prev => ({ ...prev, ...config }))
    } catch (err) {
      console.error('Erreur detectLocation:', err)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        setSiteConfig(prev => ({
          ...prev,
          contactEmail: data.contactEmail || prev.contactEmail,
          contactPhone: data.contactPhone || prev.contactPhone,
          address: data.address || prev.address,
          contactPage: (typeof data.contact_page === 'string' ? JSON.parse(data.contact_page) : data.contact_page) || prev.contactPage
        }))
      }
    } catch (err) {
      console.error('Erreur fetchConfig:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('❌ Veuillez remplir tous les champs')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('✅ Message envoyé avec succès!')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        toast.error('❌ Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Contact - Signal-Moi</title>
        <meta name="description" content="Contactez-nous pour toute question ou suggestion" />
      </Head>
      <ErrorBoundary>
      <main className="min-h-screen bg-slate-50 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.18),_transparent_25%)]" />
          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {siteConfig.contactPage?.title || 'Contactez-nous'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-indigo-100 max-w-2xl mx-auto"
            >
              {siteConfig.contactPage?.content || 'Pour toute question, nous sommes la pour vous aider'}
            </motion.p>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="section-card p-5 text-center border-t-4 border-indigo-600"
              >
                <div className="text-4xl mb-3">✉️</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Email</h3>
                <a 
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-indigo-600 hover:text-indigo-700 font-medium break-all hover:underline text-sm"
                >
                  {siteConfig.contactEmail}
                </a>
                <p className="text-gray-600 text-xs mt-2">Réponse sous 24h</p>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="section-card p-5 text-center border-t-4 border-purple-600"
              >
                <div className="text-4xl mb-3">📱</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Téléphone</h3>
                {(() => {
                  const rawPhone = siteConfig.contactPhone
                  const phoneStr = typeof rawPhone === 'string' ? rawPhone : (rawPhone && (rawPhone.number || rawPhone.value)) ? (rawPhone.number || rawPhone.value) : String(rawPhone || '')
                  const hrefPhone = phoneStr.replace(/[^0-9+]/g, '')
                  return (
                    <a 
                      href={`tel:${hrefPhone}`}
                      className="text-purple-600 hover:text-purple-700 font-medium hover:underline text-sm"
                    >
                      {phoneStr}
                    </a>
                  )
                })()}
                <p className="text-gray-600 text-xs mt-2">Lun-Ven: 09:00-18:00</p>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="section-card p-5 text-center border-t-4 border-pink-600"
              >
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Adresse</h3>
                <p className="text-gray-600 font-medium text-sm">{siteConfig.address}</p>
                <p className="text-gray-500 text-xs mt-2">Bureau principal</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="py-10 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmit} className="space-y-4 section-card p-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre demande en détail..."
                      rows="5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition resize-none"
                      required
                    />
                  </div>

                  <motion.button 
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? '📤 Envoi en cours...' : '📤 Envoyer le message'}
                  </motion.button>
                </form>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Horaires d'ouverture</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Lundi - Vendredi</span>
                      <span className="text-indigo-600 font-semibold">09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Samedi</span>
                      <span className="text-purple-600 font-semibold">10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Dimanche</span>
                      <span className="text-pink-600 font-semibold">Fermé</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Temps de réponse</h3>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p>✅ Email: Réponse sous 24h</p>
                    <p>✅ Téléphone: Réponse immédiate</p>
                    <p>✅ Formulaire: Réponse sous 48h</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Questions fréquentes</h3>
                  <p className="text-sm text-gray-600 mb-3">Consultez notre section FAQ pour des réponses rapides.</p>
                  <a href="/faq" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline text-sm">
                    Accéder aux FAQ →
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Media Gallery Section */}
        {(siteConfig.contactPage?.images?.length > 0 || siteConfig.contactPage?.videos?.length > 0) && (
          <section className="py-10 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              {siteConfig.contactPage?.images?.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Galerie Photo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {siteConfig.contactPage.images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all"
                      >
                        <img
                          src={img}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {siteConfig.contactPage?.videos?.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Vidéos</h2>
                  <div className="grid grid-cols-1 gap-8">
                    {siteConfig.contactPage.videos.map((vid, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="rounded-xl overflow-hidden shadow-md"
                      >
                        <iframe
                          width="100%"
                          height="400"
                          src={vid}
                          frameBorder="0"
                          allowFullScreen
                          className="w-full rounded-xl"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Map Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Localisation</h2>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <iframe
                title="Carte de localisation"
                width="100%"
                height="400"
                frameBorder="0"
                src={siteConfig.country === 'CM' ? 'https://www.openstreetmap.org/export/embed.html?bbox=11.4385%2C3.8333%2C11.5485%2C3.9133&layer=mapnik&marker=3.8733%2C11.4933' : 'https://www.openstreetmap.org/export/embed.html?bbox=-17.5246%2C14.6414%2C-17.3946%2C14.7614&layer=mapnik&marker=14.7014%2C-17.4596'}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
            <p className="text-center text-gray-600 mt-6 text-sm">
              Carte illustrative - aperçu libre de la localisation
            </p>
          </div>
        </section>
      </main>
      </ErrorBoundary>
    </>
  )
}
