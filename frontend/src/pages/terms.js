import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline'
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
            <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des conditions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En accédant à Signal-Moi ou en utilisant ses services, l'utilisateur accepte les présentes Conditions Générales d'Utilisation.
                Lors de la création d'un compte, la case d'acceptation des CGU et de la Politique de Confidentialité vaut consentement exprès
                et forme un accord contractuel entre l'utilisateur et l'éditeur de la plateforme, dans les limites prévues par la loi.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Si l'utilisateur n'accepte pas ces conditions, il doit cesser d'utiliser la plateforme. Signal-Moi peut modifier les CGU;
                les nouvelles conditions prennent effet dès leur publication, sauf règle légale contraire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Nature du service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Signal-Moi est un outil numérique de signalement, de suivi et de coordination entre citoyens, administrateurs,
                collaborateurs autorisés et forces compétentes. La plateforme facilite la transmission d'informations mais ne garantit
                ni intervention, ni résultat, ni délai de traitement.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi ne remplace pas les numéros d'urgence officiels, les services de secours, la police, les juridictions,
                les avocats ou les autorités administratives. En cas de danger immédiat, l'utilisateur doit contacter directement
                les services d'urgence compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compte utilisateur</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                L'utilisateur doit fournir des informations exactes, à jour et non trompeuses. Il est responsable de la confidentialité
                de ses identifiants et de toute activité réalisée depuis son compte.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Ne pas créer un compte sous une fausse identité.</li>
                <li>Ne pas partager ses identifiants avec un tiers.</li>
                <li>Notifier immédiatement tout accès non autorisé.</li>
                <li>Respecter les rôles attribués par la plateforme.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Responsabilité de l'utilisateur</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                L'utilisateur est seul responsable des faits, textes, photos, vidéos, sons, positions GPS et documents qu'il transmet.
                Il garantit que les informations publiées sont sincères au meilleur de sa connaissance et qu'il dispose des droits
                nécessaires pour les communiquer.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Tout faux signalement, signalement malveillant ou abusif est interdit.</li>
                <li>La diffamation, les menaces, le harcèlement et l'atteinte à la vie privée sont interdits.</li>
                <li>L'utilisateur doit respecter les lois, les droits des tiers et la dignité des personnes.</li>
                <li>L'utilisateur s'engage à indemniser Signal-Moi et ses concepteurs en cas de réclamation liée à son usage fautif.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contenus publiés</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Les contenus transmis par les utilisateurs restent sous leur responsabilité et ne reflètent pas nécessairement l'opinion
                de Signal-Moi, de ses concepteurs, développeurs, administrateurs ou partenaires.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi peut modérer, masquer, archiver, supprimer ou transmettre un contenu aux autorités compétentes lorsqu'une
                obligation légale, une exigence de sécurité ou une violation des présentes conditions le justifie.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation de responsabilité</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Dans toute la mesure autorisée par la loi, Signal-Moi, ses concepteurs, développeurs, administrateurs, mainteneurs,
                hébergeurs, prestataires et partenaires ne peuvent être tenus responsables des dommages indirects, pertes de données,
                pertes de chance, préjudices moraux, atteintes à la réputation ou conséquences d'un usage non conforme de la plateforme.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Interruptions, ralentissements, erreurs techniques ou indisponibilités du service.</li>
                <li>Fausses alertes, données inexactes ou contenus transmis par les utilisateurs.</li>
                <li>Décisions, retards, refus d'intervention ou actions des autorités, collaborateurs, forces de police ou tiers.</li>
                <li>Erreurs de localisation liées au GPS, au réseau, au navigateur, au terminal ou aux cartes.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Aucune clause ne limite une responsabilité qui ne pourrait pas être exclue par la loi applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                Le nom Signal-Moi, les logos, interfaces, textes, bases de données, développements, architecture, documentation et
                éléments graphiques sont protégés. Aucune licence, cession ou transfert de propriété intellectuelle n'est accordé
                à l'utilisateur, sauf droit d'accès personnel et limité à la plateforme. Toute reproduction, modification,
                extraction, distribution ou exploitation non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Rôle des concepteurs et prestataires techniques</h2>
              <p className="text-gray-700 leading-relaxed">
                Les concepteurs, développeurs, mainteneurs, hébergeurs et prestataires techniques interviennent pour créer, maintenir
                ou améliorer l'outil informatique. Ils ne sont pas les auteurs des contenus publiés par les utilisateurs et ne sont
                pas responsables des comportements, déclarations, signalements, omissions ou décisions des utilisateurs, autorités,
                collaborateurs ou tiers, sauf faute personnelle prouvée et directement imputable conformément à la loi applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Données personnelles</h2>
              <p className="text-gray-700 leading-relaxed">
                Les données personnelles sont traitées conformément à la <Link href="/privacy" className="text-indigo-600 hover:underline">Politique de Confidentialité</Link>.
                L'utilisateur reconnaît que certains signalements peuvent contenir des données sensibles et s'engage à ne transmettre
                que les informations nécessaires au traitement du dossier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suspension et résiliation</h2>
              <p className="text-gray-700 leading-relaxed">
                Signal-Moi peut suspendre ou fermer un compte, limiter une fonctionnalité, retirer un contenu ou refuser un accès
                en cas d'usage abusif, risque de sécurité, demande d'autorité compétente, violation des CGU ou comportement contraire
                aux lois applicables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Droit applicable et règlement des différends</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes conditions sont régies par le droit sénégalais, sous réserve des règles impératives applicables.
                Tout différend doit d'abord faire l'objet d'une tentative de règlement amiable. À défaut, les tribunaux compétents
                du Sénégal pourront être saisis, sauf règle légale contraire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700"><strong>Email :</strong> contact@signal-moi.sn</p>
                <p className="text-gray-700 mt-2"><strong>Téléphone :</strong> +221 77 885 16 91</p>
                <p className="text-gray-700 mt-2"><strong>Formulaire :</strong> <Link href="/contact" className="text-indigo-600 hover:underline">Contactez-nous</Link></p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Signal-Moi. Tous les droits réservés.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
