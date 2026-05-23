import Head from 'next/head'
import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { motion } from 'framer-motion'
import { API_BASE } from '../config/api'

export default function Contact() {
  const [siteConfig, setSiteConfig] = useState({
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+237 600 000 000',
    address: 'Yaounde, Cameroun',
    contactPage: { 
      title: 'Contactez-nous', 
      content: 'Pour toute question, contactez-nous directement. Nous sommes la pour vous aider.',
      images: [], 
      videos: [] 
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/api/admin/site-config`, { headers })
      if (res.ok) {
        const data = await res.json()
        setSiteConfig({
          contactEmail: data.contactEmail || siteConfig.contactEmail,
          contactPhone: data.contactPhone || siteConfig.contactPhone,
          address: data.address || siteConfig.address,
          contactPage: data.contact_page || data.contactPage || siteConfig.contactPage
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Contact - Signal-Moi</title>
        <meta name="description" content="Contactez-nous pour toute question ou information" />
      </Head>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {siteConfig.contactPage?.title || 'Contactez-nous'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-indigo-100"
            >
              {siteConfig.contactPage?.content || 'Pour toute question, nous sommes la pour vous aider'}
            </motion.p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">📧</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Email</h3>
                <a 
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-indigo-600 hover:text-indigo-700 break-all"
                >
                  {siteConfig.contactEmail}
                </a>
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">📞</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Téléphone</h3>
                <a 
                  href={`tel:${siteConfig.contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {siteConfig.contactPhone}
                </a>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">📍</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Adresse</h3>
                <p className="text-gray-600">{siteConfig.address}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-white">
          <div className="max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl shadow-md p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Votre nom"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="votre@email.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                  <input 
                    type="text" 
                    placeholder="Sujet de votre message"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    placeholder="Votre message..."
                    rows="6"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Envoyer le message
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Hours */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Horaires d'ouverture</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Lundi - Vendredi</h3>
                <p className="text-gray-600">09:00 - 18:00</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Samedi - Dimanche</h3>
                <p className="text-gray-600">10:00 - 16:00</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
