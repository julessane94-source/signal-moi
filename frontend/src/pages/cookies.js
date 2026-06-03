import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CookiesPolicy() {
  const [activeSection, setActiveSection] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-3"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Link href="/">
            <a className="inline-flex items-center text-white hover:text-indigo-100 transition mb-6">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </a>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Politique de Gestion des Cookies
          </h1>
          <p className="text-xl text-indigo-100">
            Comprenez comment nous utilisons les cookies pour améliorer votre expérience
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="space-y-12">
          {/* Section 1 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Qu'est-ce qu'un Cookie ?</h2>
            <p className="text-gray-700 leading-relaxed">
              Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez notre 
              plateforme. Les cookies nous aident à reconnaître votre appareil, à mémoriser vos préférences 
              et à améliorer votre expérience utilisateur. Nous utilisons également d'autres technologies 
              de suivi similaires, telles que les balises web et les pixels de suivi.
            </p>
          </motion.section>

          {/* Section 2 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types de Cookies que Nous Utilisons</h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Cookies Essentiels (Obligatoires)</h3>
                <p className="text-blue-800">
                  Ces cookies sont nécessaires au fonctionnement de la plateforme. Ils gèrent votre 
                  authentification, la sécurité de la session et les préférences de base. Sans ces cookies, 
                  certaines fonctionnalités ne peuvent pas fonctionner correctement.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">Cookies de Performance</h3>
                <p className="text-green-800">
                  Ces cookies collectent des informations sur la façon dont vous utilisez notre plateforme, 
                  telles que les pages visitées et les erreurs rencontrées. Cela nous aide à améliorer 
                  les performances et l'expérience utilisateur.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <h3 className="font-semibold text-amber-900 mb-2">Cookies de Préférences</h3>
                <p className="text-amber-800">
                  Nous utilisons ces cookies pour mémoriser vos préférences, telles que la langue, 
                  les paramètres d'affichage et les choix de confidentialité. Cela permet de personnaliser 
                  votre expérience lors de vos prochaines visites.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">Cookies Analytiques</h3>
                <p className="text-purple-800">
                  Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre 
                  plateforme. Nous utilisons Google Analytics et d'autres outils de suivi pour collecter 
                  des données anonymes sur l'utilisation du site.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-900 mb-2">Cookies Marketing</h3>
                <p className="text-red-800">
                  Ces cookies servent à améliorer les campagnes publicitaires et le ciblage des annonces. 
                  Nous travaillons avec des partenaires publicitaires qui peuvent placer leurs propres 
                  cookies pour suivre votre comportement.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Section 3 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies Tiers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Certains cookies sont placés par des tiers avec lesquels nous travaillons, notamment :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Google Analytics</strong> : Pour analyser l'utilisation de la plateforme</li>
              <li><strong>Services de paiement</strong> : Pour sécuriser les transactions en ligne</li>
              <li><strong>Réseaux sociaux</strong> : Pour les intégrations et le suivi des conversions</li>
              <li><strong>Partenaires publicitaires</strong> : Pour le ciblage et la mesure des annonces</li>
            </ul>
          </motion.section>

          {/* Section 4 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Gestion de vos Préférences de Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous avez le contrôle total sur les cookies acceptés sur notre plateforme. Voici comment :
            </p>
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-3">Options de Gestion :</h3>
              <ul className="space-y-2 text-indigo-800">
                <li>✓ Refuser les cookies non-essentiels via notre banneau de consentement</li>
                <li>✓ Modifier vos préférences à tout moment via les paramètres de confidentialité</li>
                <li>✓ Supprimer les cookies existants via votre navigateur</li>
                <li>✓ Activer le mode "Ne pas suivre" dans votre navigateur</li>
                <li>✓ Accepter uniquement les cookies essentiels</li>
              </ul>
            </div>
          </motion.section>

          {/* Section 5 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Durée de Conservation des Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              La durée de vie des cookies varie selon leur type :
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Cookies de Session</h3>
                <p className="text-gray-700 text-sm">
                  Supprimés automatiquement lorsque vous fermez votre navigateur
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Cookies Persistants</h3>
                <p className="text-gray-700 text-sm">
                  Conservés pendant plusieurs mois ou années selon le type
                </p>
              </div>
            </div>
          </motion.section>

          {/* Section 6 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies et Mineurs</h2>
            <p className="text-gray-700 leading-relaxed">
              Signal-Moi n'est pas destinée aux enfants de moins de 13 ans. Nous ne collectons 
              intentionnellement aucune donnée personnelle d'enfants. Si nous découvrez que nous avons 
              collecté des données d'un enfant, nous les supprimerons immédiatement. Les parents peuvent 
              nous contacter à julessane94@gmail.com pour signaler toute préoccupation.
            </p>
          </motion.section>

          {/* Section 7 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Transferts Internationaux</h2>
            <p className="text-gray-700 leading-relaxed">
              Les informations collectées via les cookies peuvent être transférées, traitées et stockées 
              en dehors de votre pays de résidence, y compris aux États-Unis. En utilisant notre plateforme, 
              vous consentez à ces transferts internationaux, conformément à nos garanties de protection 
              des données.
            </p>
          </motion.section>

          {/* Section 8 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications de cette Politique</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous pouvons mettre à jour cette Politique de Gestion des Cookies de temps à autre pour 
              refléter les changements technologiques, juridiques ou autres. Nous vous encourageons à 
              consulter régulièrement cette page pour rester informé de nos pratiques en matière de cookies. 
              Les modifications majeures vous seront notifiées par email ou via un avis sur notre plateforme.
            </p>
          </motion.section>

          {/* Section 9 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Vos Droits</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Selon la loi applicable (notamment le RGPD), vous avez les droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Droit d'accès</strong> : Accéder à vos données personnelles collectées via les cookies</li>
              <li><strong>Droit de rectification</strong> : Corriger les données inexactes</li>
              <li><strong>Droit à l'oubli</strong> : Demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> : Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : Vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer le consentement</strong> : À tout moment, sans frais</li>
            </ul>
          </motion.section>

          {/* Section 10 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si vous avez des questions ou des préoccupations concernant notre utilisation des cookies, 
              veuillez nous contacter :
            </p>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
              <p className="text-gray-900"><strong>Email :</strong> julessane94@gmail.com</p>
              <p className="text-gray-900"><strong>Téléphone :</strong> +221778851691</p>
              <p className="text-gray-700 mt-4 text-sm">
                Nous répondons généralement aux demandes dans les 7 jours ouvrables.
              </p>
            </div>
          </motion.section>

          {/* Last Updated */}
          <motion.div
            variants={itemVariants}
            className="border-t border-gray-200 pt-8 mt-12"
          >
            <p className="text-gray-600 text-sm">
              <strong>Dernière mise à jour :</strong> 3 juin 2026
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
