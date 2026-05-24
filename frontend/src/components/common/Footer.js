import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TwitterIcon,
  FacebookIcon,
  LinkedInIcon
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
  )
}

export default function Footer() {
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

  const socialLinks = [
    { name: 'Twitter', icon: SocialIcons.Twitter, href: 'https://twitter.com' },
    { name: 'Facebook', icon: SocialIcons.Facebook, href: 'https://facebook.com' },
    { name: 'LinkedIn', icon: SocialIcons.LinkedIn, href: 'https://linkedin.com' },
  ]

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
                <EnvelopeIcon className="h-4 w-4 text-red-500" />
                <a href="mailto:contact@signal-moi.com" className="hover:text-white transition-colors">
                  contact@signal-moi.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <PhoneIcon className="h-4 w-4 text-red-500" />
                <a href="tel:+237600000000" className="hover:text-white transition-colors">
                  +237 6 00 00 00 00
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPinIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Yaoundé, Cameroun</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8"></div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-400 text-sm">
            &copy; 2024 Signal-Moi. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <span>Conçu avec ❤️ pour la communauté</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}