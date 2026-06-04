import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/api'
import {
  EnvelopeIcon as Envelope,
  PhoneIcon as Phone,
  MapPinIcon as MapPin
} from '@heroicons/react/24/outline'

// Icons de réseaux sociaux (puisque Heroicons ne les a pas)
const SocialIcons = {
  Twitter: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.29 20c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
  ),
  Facebook: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.81 0-9.728h3.554v1.375c.427-.659 1.191-1.592 2.897-1.592 2.117 0 3.704 1.385 3.704 4.362v5.583zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.953.77-1.715 1.958-1.715 1.188 0 1.915.762 1.915 1.715 0 .953-.727 1.715-1.958 1.715zm1.581 11.597H3.635V9.579h3.283v10.873zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  ),
  Instagram: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.521h-11.042V6.521h11.042v11zm-5.521-9.404c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z" />
    </svg>
  ),
  WhatsApp: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371 0-.57 0-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.28-4.753 6.193-4.542 10.19.211 3.997 2.813 7.429 6.487 8.795a9.9 9.9 0 004.773 1.255h.004c5.452 0 9.885-4.433 9.885-9.885 0-2.65-.994-5.151-2.8-7.152-1.806-2.001-4.281-3.1-6.869-3.1" />
    </svg>
  )
}

export default function Footer() {
  const [contactInfo, setContactInfo] = useState({
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+221 77 88516 91',
    address: 'Dakar, Sénégal',
    country: 'SN',
    socialLinks: {
      facebook: '',
      whatsapp: '',
      twitter: '',
      instagram: ''
    }
  })

  useEffect(() => {
    fetchConfig()
    detectLocation()
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
      setContactInfo(prev => ({ ...prev, ...config }))
    } catch (err) {
      console.error('Erreur detectLocation:', err)
      // Par défaut Sénégal
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        setContactInfo(prev => ({
          ...prev,
          contactEmail: data.contactEmail || prev.contactEmail,
          contactPhone: data.contactPhone || prev.contactPhone,
          address: data.address || prev.address,
          socialLinks: data.socialLinks || prev.socialLinks
        }))
      }
    } catch (err) {
      console.error('Erreur fetchConfig:', err)
    }
  }

  const footerLinks = {
    Produit: [
      { name: 'Signaler', href: '/citizen/signalement' },
      { name: 'Campagnes', href: '/campagnes' },
      { name: 'Plaidoyers', href: '/plaidoyers' },
    ],
    Société: [
      { name: 'À propos', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Blog', href: '/blog' },
    ],
    Légal: [
      { name: 'Confidentialité', href: '/privacy' },
      { name: 'Conditions', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
    ]
  }

  const buildSocialLinks = () => {
    const links = []
    if (contactInfo.socialLinks?.facebook) {
      links.push({ name: 'Facebook', icon: SocialIcons.Facebook, href: contactInfo.socialLinks.facebook })
    }
    if (contactInfo.socialLinks?.twitter) {
      links.push({ name: 'Twitter', icon: SocialIcons.Twitter, href: contactInfo.socialLinks.twitter })
    }
    if (contactInfo.socialLinks?.instagram) {
      links.push({ name: 'Instagram', icon: SocialIcons.Instagram, href: contactInfo.socialLinks.instagram })
    }
    if (contactInfo.socialLinks?.whatsapp) {
      const rawWa = String(contactInfo.socialLinks.whatsapp || '')
      const waNum = rawWa.replace(/[^0-9]/g, '')
      links.push({ name: 'WhatsApp', icon: SocialIcons.WhatsApp, href: `https://wa.me/${waNum}` })
    }
    return links.length > 0 ? links : [{ name: 'Twitter', icon: SocialIcons.Twitter, href: '#' }]
  }

  const socialLinks = buildSocialLinks()

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🚨</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Signal-Moi
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Une plateforme pour que votre voix soit entendue. Signalez les problèmes de votre communauté.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon />
                  </motion.a>
                )
              })}
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <motion.li key={link.name} whileHover={{ x: 4 }}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Envelope className="h-4 w-4 text-red-500" />
                <a href={`mailto:${contactInfo.contactEmail}`} className="hover:text-white transition-colors">
                  {contactInfo.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4 text-red-500" />
                {(() => {
                  const rawPhone = String(contactInfo.contactPhone || '')
                  const telHref = `tel:${rawPhone.replace(/[^0-9+]/g, '')}`
                  const display = contactInfo.contactPhone ?? rawPhone
                  return (
                    <a href={telHref} className="hover:text-white transition-colors">
                      {display}
                    </a>
                  )
                })()}
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.address}</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Donation Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="my-12 p-8 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-pink-600 text-white shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Soutenez Signal-Moi</h3>
              <p className="text-red-50">
                Contribuez au développement de cette plateforme citoyenne qui change les communautés.
              </p>
            </div>
            <Link href="/donate">
              <a className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-all transform hover:scale-105 whitespace-nowrap">
                <span>❤️</span>
                Faire un don
              </a>
            </Link>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8"></div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-400 text-sm">
            &copy; 2026 Signal-Moi. Tous droits réservés.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-400 text-sm">
            <span>Conçu avec ❤️ pour la communauté</span>
            <span className="hidden md:block">|</span>
            <span>
              Plateforme conçue par{' '}
              <a 
                href="https://attidiany.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition-colors font-semibold"
              >
                Souleymane Sane (AT-TIDIANY)
              </a>
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}