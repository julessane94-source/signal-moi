import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from './src/components/common/Navbar'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'react-toastify'

export default function Contact() {
  const [contactInfo, setContactInfo] = useState([
    { icon: '📍', title: 'Adresse', content: 'Yaoundé, Cameroun' },
    { icon: '📞', title: 'Téléphone', content: '+237 600 000 000' },
    { icon: '✉️', title: 'Email', content: 'contact@signal-moi.com' },
    { icon: '🕒', title: 'Horaires', content: 'Lun-Ven: 8h-18h' },
  ])

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config`)
        if (!res.ok) return
        const cfg = await res.json()
        setContactInfo([
          { icon: '📍', title: 'Adresse', content: cfg.address || 'Yaoundé, Cameroun' },
          { icon: '📞', title: 'Téléphone', content: cfg.phone || '+237 600 000 000' },
          { icon: '✉️', title: 'Email', content: cfg.contactEmail || 'contact@signal-moi.com' },
          { icon: '🕒', title: 'Horaires', content: 'Lun-Ven: 8h-18h' }
        ])
      } catch (e) {
        // ignore network errors, keep defaults
      }
    }
    loadConfig()
  }, [])
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success('Message envoyé ! Nous vous répondrons rapidement.')
        setFormData({ nom: '', email: '', sujet: '', message: '' })
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur r?seau')
    } finally {
      setLoading(false)
    }
  }

  

  const faqs = [
    {
      q: 'Comment signaler un incident ?',
      a: (
        <>
          <p className="mb-2">Cliquez sur le bouton ci-dessous pour créer un nouveau signalement. Vous devez être connecté.</p>
          <Link href="/citizen/signalement" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Faire un signalement</Link>
        </>
      )
    },
    { q: 'Mes données sont-elles protégées ?', a: 'Oui, vos données sont chiffrées et vous pouvez signaler anonymement.' },
    { q: 'Que deviennent mes signalements ?', a: 'Ils sont transmis aux autorités compétentes et vous pouvez suivre leur évolution.' },
    { q: 'Comment participer aux campagnes ?', a: 'Inscrivez-vous depuis votre espace citoyen ou la page des campagnes.' },
  ]

  return (
    <>
      <Head>
        <title>Contact - Signal-Moi</title>
        <meta name="description" content="Contactez l'?quipe Signal-Moi" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
            <p className="text-xl text-indigo-100">
              Une question ? Une suggestion ? Nous sommes là pour vous aider
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-6 text-center"
                >
                  <div className="text-4xl mb-3">{info.icon}</div>
                  <h3 className="font-semibold text-gray-900">{info.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{info.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulaire + FAQ */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Formulaire */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      name="nom"
                      required
                      value={formData.nom}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet *</label>
                    <input
                      type="text"
                      name="sujet"
                      required
                      value={formData.sujet}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </form>
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Foire aux questions</h2>
                <FAQList faqs={faqs} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Carte */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-500">Carte interactive - Yaoundé, Cameroun</p>
                <p className="text-sm text-gray-400">(Intégration Google Maps à venir)</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

  function FAQList({ faqs }) {
    const [openIndex, setOpenIndex] = useState(null)

    return (
      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="bg-gray-50 rounded-lg">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full text-left p-4 flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-gray-600 text-sm">
                  {typeof faq.a === 'string' ? <p>{faq.a}</p> : faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }