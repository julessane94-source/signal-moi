import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon as Envelope, PhoneIcon as Phone, MapPinIcon as MapPin, HeartIcon as Heart } from '@heroicons/react/24/outline';

export default function Footer() {
  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <motion.div
        variants={footerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Signal-Moi</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Une plateforme de signalement citoyenne pour une meilleure transparence et responsabilité.
            </p>
            <div className="mt-6">
              <Link href="/donate">
                <a className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105">
                  <Heart className="w-4 h-4" />
                  Soutenir le projet
                </a>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq">
                  <a className="text-gray-400 hover:text-white transition text-sm">FAQ</a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="text-gray-400 hover:text-white transition text-sm">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-400 hover:text-white transition text-sm">Contact</a>
                </Link>
              </li>
              <li>
                <Link href="/settings">
                  <a className="text-gray-400 hover:text-white transition text-sm">Paramètres</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <a className="text-gray-400 hover:text-white transition text-sm">Confidentialité</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-gray-400 hover:text-white transition text-sm">Conditions</a>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <a className="text-gray-400 hover:text-white transition text-sm">Cookies</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Nous Contacter</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Envelope className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:julessane94@gmail.com" className="text-gray-400 hover:text-white transition">
                  julessane94@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <a href="tel:+221778851691" className="text-gray-400 hover:text-white transition">
                  +221 778 851 691
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Sédhiou, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 Signal-Moi. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
              <span className="text-sm">GitHub</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
              <span className="text-sm">Twitter</span>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
              <span className="text-sm">Facebook</span>
            </a>
          </div>
        </div>

        {/* Donation Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 p-6 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-center"
        >
          <p className="text-white font-semibold mb-3">
            💝 Signal-Moi est une plateforme non-lucrative dépendante de vos donations
          </p>
          <p className="text-red-100 text-sm mb-4">
            Chaque don nous aide à améliorer nos services et à continuer notre mission citoyenne
          </p>
          <Link href="/donate">
            <a className="inline-flex items-center gap-2 px-6 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition">
              <Heart className="w-5 h-5" />
              Faire un don maintenant
            </a>
          </Link>
        </motion.div>
      </motion.div>
    </footer>
  );
}
