'use client'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import ErrorBoundary from '../components/common/ErrorBoundary'
import Footer from '../components/common/Footer'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../config/api'

export default function Contact() {
  const [siteConfig, setSiteConfig] = useState({
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+237 600 000 000',
    address: 'Yaounde, Cameroun',
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
    fetchConfig()
  }, [])

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
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Contact - Signal-Moi</title>
        <meta name="description" content="Contactez-nous pour toute question ou suggestion" />
      </Head>
      <Navbar />
      <ErrorBoundary>
      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              {siteConfig.contactPage?.title || 'Contactez-nous'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto"
            >
              {siteConfig.contactPage?.content || 'Pour toute question, nous sommes la pour vous aider'}
            </motion.p>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-center border-t-4 border-indigo-600"
              >
                <div className="text-5xl mb-4">✉️</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Email</h3>
                <a 
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-indigo-600 hover:text-indigo-700 font-medium break-all hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
                <p className="text-gray-600 text-sm mt-3">Réponse sous 24h</p>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-center border-t-4 border-purple-600"
              >
                <div className="text-5xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Téléphone</h3>
                <a 
                  href={`tel:${siteConfig.contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  {siteConfig.contactPhone}
                </a>
                <p className="text-gray-600 text-sm mt-3">Lun-Ven: 09:00-18:00</p>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-center border-t-4 border-pink-600"
              >
                <div className="text-5xl mb-4">📍</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Adresse</h3>
                <p className="text-gray-600 font-medium">{siteConfig.address}</p>
                <p className="text-gray-500 text-sm mt-3">Bureau principal</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre demande en détail..."
                      rows="7"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition resize-none"
                      required
                    />
                  </div>

                  <motion.button 
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '📤 Envoi en cours...' : '📤 Envoyer le message'}
                  </motion.button>
                </form>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Horaires d'ouverture</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Lundi - Vendredi</span>
                      <span className="text-indigo-600 font-semibold">09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Samedi</span>
                      <span className="text-purple-600 font-semibold">10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Dimanche</span>
                      <span className="text-pink-600 font-semibold">Fermé</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Temps de réponse</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>✅ Email: Réponse sous 24h</p>
                    <p>✅ Téléphone: Réponse immédiate</p>
                    <p>✅ Formulaire: Réponse sous 48h</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions fréquentes</h3>
                  <p className="text-gray-600 mb-4">Consultez notre section FAQ pour des réponses rapides à vos questions les plus courantes.</p>
                  <a href="/faq" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline">
                    Accéder aux FAQ →
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Media Gallery Section */}
        {(siteConfig.contactPage?.images?.length > 0 || siteConfig.contactPage?.videos?.length > 0) && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              {siteConfig.contactPage?.images?.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Galerie Photo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          className="w-full h-64 object-cover hover:scale-110 transition-transform duration-300"
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
                width="100%"
                height="400"
                frameBorder="0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.7758486206447!2d11.502368!3d3.848034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf7d8e8e8e8d%3A0x1234567890abcdef!2sYaound%C3%A9%2C%20Cameroon!5e0!3m2!1sfr!2scm!4v1234567890"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
            <p className="text-center text-gray-600 mt-6 text-sm">
              Carte illustrative - Consultez Google Maps pour les directions
            </p>
          </div>
        </section>
      </main>
      </ErrorBoundary>

      <Footer />
    </>
  )
}
