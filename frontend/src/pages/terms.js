import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

export default function Terms() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Conditions Générales d'Utilisation - Signal-Moi</title>
        <meta name="description" content="Conditions générales d'utilisation de Signal-Moi" />
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
              Conditions Générales d'Utilisation
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des Conditions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En accédant et en utilisant Signal-Moi, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi se réserve le droit de modifier ces conditions à tout moment. Les modifications prendront effet 
                dès leur publication sur le site.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Signal-Moi est une plateforme numérique qui permet aux citoyens de signaler des problèmes publics, 
                de lancer des campagnes de sensibilisation et de participer à des plaidoyers pour le changement social.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Notre service met en relation les citoyens, les collaborateurs, les autorités locales et les forces de police 
                pour faciliter la résolution des problèmes communautaires.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compte Utilisateur</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pour utiliser Signal-Moi, vous devez créer un compte en fournissant des informations exactes et à jour. 
                Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Vous garantissez que vous avez au moins 18 ans</li>
                <li>Vous êtes responsable de toutes les activités effectuées sous votre compte</li>
                <li>Vous acceptez de notifier immédiatement Signal-Moi de tout accès non autorisé</li>
                <li>Vous acceptez de ne pas partager vos identifiants avec d'autres utilisateurs</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Comportement des Utilisateurs</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En utilisant Signal-Moi, vous acceptez de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Respecter les lois et réglementations en vigueur</li>
                <li>Ne pas partager du contenu illégal, diffamatoire, ou offensant</li>
                <li>Ne pas harceler ou menacer d'autres utilisateurs</li>
                <li>Ne pas tenter de pirater ou accéder à des données non autorisées</li>
                <li>Ne pas publier de fausses informations ou de contenu trompeur</li>
                <li>Respecter la vie privée et les droits des tiers</li>
                <li>Ne pas utiliser la plateforme à des fins commerciales sans autorisation</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contenu Utilisateur</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vous conservez la propriété de tout contenu que vous créez sur Signal-Moi (signalements, commentaires, images, etc.). 
                En publiant du contenu, vous accordez à Signal-Moi une licence non exclusive pour utiliser, reproduire et afficher ce contenu 
                dans le cadre de la prestation de nos services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi se réserve le droit de supprimer tout contenu qui viole ces conditions ou les lois applicables.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation de Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Signal-Moi ne peut pas être tenu responsable de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Les dommages indirects ou consécutifs</li>
                <li>Les perturbations ou les interruptions de service</li>
                <li>Les actions ou les inactions des utilisateurs tiers</li>
                <li>La perte de données ou les virus</li>
                <li>L'utilisation abusive du service par les utilisateurs</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi fournit le service "tel quel" et décline toute garantie explicite ou implicite.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété Intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                Tous les éléments de Signal-Moi (code, design, logo, textes) sont protégés par les droits d'auteur et les 
                lois sur la propriété intellectuelle. Vous ne pouvez pas reproduire, modifier ou distribuer ces éléments 
                sans autorisation écrite préalable.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Liens Externes</h2>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi peut contenir des liens vers des sites tiers. Nous ne sommes pas responsables du contenu, 
                de la disponibilité ou de la sécurité de ces sites. Consultez leurs conditions d'utilisation avant de les utiliser.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Données Personnelles</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Le traitement de vos données personnelles est régi par notre Politique de Confidentialité. 
                En utilisant Signal-Moi, vous consentez à la collecte et au traitement de vos données conformément à cette politique.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Pour plus d'informations, veuillez consulter notre <Link href="/privacy" className="text-indigo-600 hover:underline">Politique de Confidentialité</Link>.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suspension et Résiliation</h2>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi se réserve le droit de suspendre ou résilier votre compte à tout moment, sans préavis, 
                si vous violez ces conditions ou les lois applicables.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Droit Applicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Ces Conditions Générales d'Utilisation sont régies par les lois du pays dans lequel Signal-Moi opère. 
                Tout différend sera résolu par voie de négociation amiable ou, en dernier recours, devant les tribunaux compétents.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Si vous avez des questions concernant ces Conditions Générales d'Utilisation, veuillez nous contacter :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700"><strong>Email :</strong> support@signal-moi.app</p>
                <p className="text-gray-700 mt-2"><strong>Téléphone :</strong> +237 xxx xxx xxx</p>
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
