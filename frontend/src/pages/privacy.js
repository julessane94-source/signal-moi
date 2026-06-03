import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

export default function Privacy() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Politique de Confidentialité - Signal-Moi</title>
        <meta name="description" content="Politique de confidentialité de Signal-Moi" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Politique de Confidentialité
            </h1>
            <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 space-y-8"
          >
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous Collectons</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous collectons les types d'informations suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li><strong>Informations de compte :</strong> nom, prénom, email, numéro de téléphone, adresse, date de naissance</li>
                <li><strong>Informations de profil :</strong> photo de profil, biographie, rôle (citoyen, police, collaborateur, admin)</li>
                <li><strong>Contenu utilisateur :</strong> signalements, commentaires, images, vidéos, campagnes, plaidoyers</li>
                <li><strong>Informations de localisation :</strong> coordonnées GPS des signalements</li>
                <li><strong>Informations techniques :</strong> adresse IP, type de navigateur, système d'exploitation, pages visitées, temps d'accès</li>
                <li><strong>Données de communication :</strong> messages, notifications, supports de contact</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Base Légale du Traitement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous traitons vos données personnelles sur les bases suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Consentement :</strong> vous avez explicitement consenti au traitement</li>
                <li><strong>Exécution de contrat :</strong> le traitement est nécessaire pour exécuter nos services</li>
                <li><strong>Obligations légales :</strong> le traitement est requis par la loi</li>
                <li><strong>Intérêts légitimes :</strong> le traitement est nécessaire pour nos intérêts légitimes</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Comment nous Utilisons vos Informations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous utilisons vos informations pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Créer et maintenir votre compte</li>
                <li>Fournir et améliorer nos services</li>
                <li>Traiter vos signalements et demandes</li>
                <li>Communiquer avec vous concernant mises à jour et notifications</li>
                <li>Assurer la sécurité et la conformité légale</li>
                <li>Effectuer des analyses et statistiques</li>
                <li>Vous envoyer du contenu marketing (avec votre consentement)</li>
                <li>Résoudre les litiges et appliquer nos accords</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage des Informations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous partageons vos informations avec :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li><strong>Autres utilisateurs :</strong> vos signalements et profil sont visibles aux utilisateurs appropriés</li>
                <li><strong>Autorités publiques :</strong> pour faciliter le traitement des signalements</li>
                <li><strong>Forces de police :</strong> lorsque nécessaire pour la sécurité publique</li>
                <li><strong>Prestataires de services :</strong> hébergement, paiement, analytics</li>
                <li><strong>Partenaires :</strong> collaborateurs agréés pour la plateforme</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité des Données</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Signal-Moi implémente des mesures de sécurité techniques et organisationnelles pour protéger vos données :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Chiffrement SSL/TLS pour la transmission des données</li>
                <li>Hachage sécurisé des mots de passe</li>
                <li>Accès contrôlé aux informations sensibles</li>
                <li>Audit régulier de la sécurité</li>
                <li>Sauvegarde régulière des données</li>
                <li>Protocoles de sécurité standards de l'industrie</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies et Suivi</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Signal-Moi utilise des cookies et des technologies de suivi pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Maintenir votre session de connexion</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l'utilisation du site</li>
                <li>Améliorer l'expérience utilisateur</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Vous pouvez gérer les cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Vos Droits</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vous avez le droit de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Accéder :</strong> demander une copie de vos données personnelles</li>
                <li><strong>Rectifier :</strong> corriger les informations inexactes</li>
                <li><strong>Effacer :</strong> demander la suppression de vos données (« droit à l'oubli »)</li>
                <li><strong>Limiter :</strong> limiter le traitement de vos données</li>
                <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Retirer le consentement :</strong> retirer votre consentement à tout moment</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Durée de Conservation</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous conservons vos données personnelles :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Tant que nécessaire pour fournir nos services</li>
                <li>Conformément aux obligations légales</li>
                <li>Jusqu'à la suppression de votre compte</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Les signalements peuvent être conservés plus longtemps à titre d'archivage public.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pour toute question concernant cette Politique de Confidentialité ou vos droits, contactez-nous :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700"><strong>Email :</strong> julessane94@gmail.com</p>
                <p className="text-gray-700 mt-2"><strong>Téléphone :</strong> +221778851691</p>
                <p className="text-gray-700 mt-2">
                  <strong>Formulaire de contact :</strong> <Link href="/contact" className="text-indigo-600 hover:underline">Cliquez ici</Link>
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} Signal-Moi. Tous les droits réservés.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
