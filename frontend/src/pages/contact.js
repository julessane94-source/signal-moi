import Head from 'next/head'
import { useState, useEffect } from 'react'
import ErrorBoundary from '../components/common/ErrorBoundary'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../config/api'
import { 
  Envelope, 
  Phone, 
  MapPin,
  ArrowLeft,
  Sparkles,
  CheckCircle
} from '@heroicons/react/24/outline'

export default function Contact() {
  const [siteConfig, setSiteConfig] = useState({
    contactEmail: 'julessane94@gmail.com',
    contactPhone: '+221778851691',
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
          contactEmail: 'julessane94@gmail.com',
          contactPhone: '+221778851691',
          address: 'Dakar, Sénégal',
          country: 'SN'
        },
        CM: {
          contactEmail: 'julessane94@gmail.com',
          contactPhone: '+221778851691',
          address: 'Yaoundé, Cameroun',
          country: 'CM'
        },
        CI: {
          contactEmail: 'julessane94@gmail.com',
          contactPhone: '+221778851691',
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
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        />
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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 text-white border border-white/30"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Nous sommes là pour vous aider</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {siteConfig.contactPage?.title || 'Contactez-nous'}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8"
            >
              {siteConfig.contactPage?.content || 'Nous répondons à vos questions, suggestions et préoccupations avec professionnalisme et attention.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <a href="#form" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all hover:scale-105">
                Envoyer un message
              </a>
              <a href="#info" className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold border border-white/30 hover:bg-white/30 transition-all">
                Nos coordonnées
              </a>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section id="info" className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Envelope className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                <a 
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold break-all hover:underline mb-3 block"
                >
                  {siteConfig.contactEmail}
                </a>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Réponse dans 24h
                </p>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Phone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Téléphone</h3>
                {(() => {
                  const rawPhone = siteConfig.contactPhone
                  const phoneStr = typeof rawPhone === 'string' ? rawPhone : (rawPhone && (rawPhone.number || rawPhone.value)) ? (rawPhone.number || rawPhone.value) : String(rawPhone || '')
                  const hrefPhone = phoneStr.replace(/[^0-9+]/g, '')
                  return (
                    <a 
                      href={`tel:${hrefPhone}`}
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline mb-3 block"
                    >
                      {phoneStr}
                    </a>
                  )
                })()}
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Lun-Ven: 09:00-18:00
                </p>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Adresse</h3>
                <p className="text-gray-600 font-medium mb-3">{siteConfig.address}</p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bureau principal
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section id="form" className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Envoyez-nous un message</h2>
                  <p className="text-gray-600 mb-8">Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Nom complet <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Votre nom"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="votre@email.com"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Sujet <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Sujet de votre message"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Décrivez votre demande en détail..."
                        rows="6"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-900 resize-none"
                        required
                      />
                    </div>

                    <motion.button 
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? '⏳ Envoi en cours...' : '📤 Envoyer le message'}
                    </motion.button>
                  </form>
                </div>
              </motion.div>

              {/* Sidebar Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {/* Hours */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Horaires</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Lun - Ven</span>
                      <span className="text-blue-600 font-bold">09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Samedi</span>
                      <span className="text-blue-600 font-bold">10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Dimanche</span>
                      <span className="text-gray-500 font-bold">Fermé</span>
                    </div>
                  </div>
                </div>

                {/* Response Times */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Temps de réponse</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Email: <strong>24h</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Téléphone: <strong>Immédiat</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Formulaire: <strong>48h</strong></span>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Questions fréquentes ?</h3>
                  <p className="text-gray-700 text-sm mb-4">Consultez notre FAQ pour des réponses rapides à vos questions.</p>
                  <a href="/faq" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold hover:underline">
                    Consulter la FAQ →
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Media Gallery Section */}
        {(siteConfig.contactPage?.images?.length > 0 || siteConfig.contactPage?.videos?.length > 0) && (
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              {siteConfig.contactPage?.images?.length > 0 && (
                <div className="mb-16">
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center"
                  >
                    Galerie Photo
                  </motion.h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {siteConfig.contactPage.images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105"
                      >
                        <img
                          src={img}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-64 object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {siteConfig.contactPage?.videos?.length > 0 && (
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center"
                  >
                    Vidéos
                  </motion.h2>
                  <div className="grid grid-cols-1 gap-8">
                    {siteConfig.contactPage.videos.map((vid, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="rounded-2xl overflow-hidden shadow-lg"
                      >
                        <iframe
                          width="100%"
                          height="500"
                          src={vid}
                          frameBorder="0"
                          allowFullScreen
                          className="w-full"
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
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Localisation</h2>
              <p className="text-gray-600 text-lg">Retrouvez-nous sur la carte</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
            >
              <iframe
                title="Carte de localisation"
                width="100%"
                height="450"
                frameBorder="0"
                src={siteConfig.country === 'CM' ? 'https://www.openstreetmap.org/export/embed.html?bbox=11.4385%2C3.8333%2C11.5485%2C3.9133&layer=mapnik&marker=3.8733%2C11.4933' : 'https://www.openstreetmap.org/export/embed.html?bbox=-17.5246%2C14.6414%2C-17.3946%2C14.7614&layer=mapnik&marker=14.7014%2C-17.4596'}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </motion.div>

            <p className="text-center text-gray-600 mt-8 text-sm">
              Vous pouvez nous visiter à l'adresse indiquée ci-dessus. Une carte plus détaillée s'affichera si vous cliquez sur l'icône d'agrandissement.
            </p>
          </div>
        </section>
      </main>
      </ErrorBoundary>
    </>
  );
}
