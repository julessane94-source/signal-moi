import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

const sections = [
  {
    title: '1. Objet',
    body: [
      "Les présentes Conditions Générales d'Utilisation encadrent l'accès et l'utilisation de la plateforme Signal-Moi, accessible notamment depuis le site signal-moi.sn.",
      "Signal-Moi est une plateforme citoyenne permettant de signaler des situations, incidents ou besoins de terrain, de transmettre des éléments de preuve, de partager une localisation et de suivre l'évolution d'un dossier."
    ]
  },
  {
    title: '2. Acceptation des conditions',
    body: [
      "En créant un compte, en cochant la case d'acceptation ou en utilisant la plateforme, l'utilisateur reconnaît avoir lu, compris et accepté les présentes conditions ainsi que la Politique de Confidentialité.",
      "Cette acceptation constitue un accord entre l'utilisateur et l'éditeur de la plateforme, dans les limites prévues par la loi applicable. Si l'utilisateur refuse ces conditions, il doit cesser d'utiliser Signal-Moi."
    ]
  },
  {
    title: '3. Nature du service',
    body: [
      "Signal-Moi est un outil de transmission, de coordination et de suivi. Il ne garantit pas une intervention, un résultat, une qualification juridique des faits ou un délai de traitement.",
      "La plateforme ne remplace pas les numéros d'urgence, les services de secours, la police, la gendarmerie, les juridictions, les avocats ou les autorités administratives. En cas de danger immédiat, l'utilisateur doit contacter directement les services d'urgence compétents."
    ]
  },
  {
    title: '4. Compte utilisateur',
    body: [
      "L'utilisateur s'engage à fournir des informations exactes, à jour et non trompeuses lors de son inscription et pendant l'utilisation de la plateforme.",
      "Il est responsable de la confidentialité de ses identifiants et de toute action effectuée depuis son compte. Tout accès non autorisé doit être signalé rapidement à l'équipe Signal-Moi."
    ]
  },
  {
    title: "5. Obligations de l'utilisateur",
    body: [
      "L'utilisateur s'engage à utiliser Signal-Moi de bonne foi, dans le respect des lois, des droits des tiers, de la vie privée et de la dignité des personnes.",
      "Sont strictement interdits: les faux signalements, les signalements malveillants, les accusations mensongères, la diffamation, les menaces, le harcèlement, l'usurpation d'identité, la publication de contenus illégaux ou la transmission volontaire d'informations trompeuses."
    ]
  },
  {
    title: '6. Responsabilité des contenus',
    body: [
      "L'utilisateur est seul responsable des textes, images, vidéos, audios, localisations, documents et informations qu'il transmet sur la plateforme.",
      "Il garantit disposer des droits et autorisations nécessaires pour communiquer ces contenus. Il s'engage à indemniser Signal-Moi, ses concepteurs, administrateurs, développeurs, partenaires et prestataires contre toute réclamation résultant d'un usage fautif, abusif ou illégal de la plateforme."
    ]
  },
  {
    title: '7. Traitement et modération des signalements',
    body: [
      "Signal-Moi peut modérer, masquer, archiver, supprimer, transmettre ou conserver un contenu lorsqu'une obligation légale, une exigence de sécurité, une demande d'autorité compétente ou une violation des présentes conditions le justifie.",
      "Les contenus publiés par les utilisateurs ne reflètent pas nécessairement l'opinion de Signal-Moi, de ses concepteurs, de ses administrateurs ou de ses partenaires."
    ]
  },
  {
    title: '8. Données personnelles',
    body: [
      "Les données personnelles sont traitées conformément à la Politique de Confidentialité de Signal-Moi.",
      "L'utilisateur reconnaît que certains signalements peuvent contenir des informations sensibles. Il s'engage à ne transmettre que les données nécessaires au traitement du signalement et à respecter les droits des personnes concernées."
    ],
    link: { href: '/privacy', label: 'Lire la Politique de Confidentialité' }
  },
  {
    title: '9. Localisation, vidéo et preuves',
    body: [
      "Certaines fonctionnalités utilisent la localisation GPS, l'appareil photo, le micro, la vidéo ou l'envoi de fichiers. L'utilisateur reste libre d'autoriser ou non ces accès depuis son navigateur ou son appareil.",
      "Les coordonnées GPS peuvent être imprécises selon le terminal, le réseau, le navigateur, l'environnement ou les services de cartographie. Signal-Moi ne garantit pas l'exactitude absolue d'une localisation."
    ]
  },
  {
    title: '10. Propriété intellectuelle',
    body: [
      "Le nom Signal-Moi, les logos, interfaces, textes, graphismes, bases de données, développements, architecture technique, documentation et éléments visuels sont protégés par les règles applicables à la propriété intellectuelle.",
      "Aucun droit de propriété intellectuelle n'est transféré à l'utilisateur. Toute reproduction, extraction, modification, distribution, revente ou exploitation non autorisée est interdite."
    ]
  },
  {
    title: '11. Rôle des concepteurs et prestataires techniques',
    body: [
      "Les concepteurs, développeurs, mainteneurs, hébergeurs et prestataires techniques interviennent pour créer, maintenir, sécuriser ou améliorer l'outil informatique.",
      "Ils ne sont pas les auteurs des contenus publiés par les utilisateurs et ne sont pas responsables des comportements, signalements, décisions, omissions ou interventions des utilisateurs, autorités, collaborateurs ou tiers, sauf faute personnelle prouvée et directement imputable conformément à la loi."
    ]
  },
  {
    title: '12. Limitation de responsabilité',
    body: [
      "Dans toute la mesure permise par la loi, Signal-Moi, ses concepteurs, administrateurs, développeurs, mainteneurs, hébergeurs, prestataires et partenaires ne peuvent être tenus responsables des dommages indirects, pertes de données, pertes de chance, préjudices moraux, atteintes à la réputation ou conséquences d'un usage non conforme de la plateforme.",
      "Signal-Moi ne peut notamment pas être tenu responsable des interruptions de service, erreurs techniques, informations inexactes transmises par les utilisateurs, fausses alertes, retards d'intervention, refus d'intervention ou décisions prises par des tiers."
    ]
  },
  {
    title: '13. Suspension ou suppression de compte',
    body: [
      "Signal-Moi peut suspendre, limiter ou supprimer un compte, retirer un contenu ou restreindre une fonctionnalité en cas d'usage abusif, risque de sécurité, violation des présentes conditions, demande d'autorité compétente ou comportement contraire aux lois applicables."
    ]
  },
  {
    title: '14. Modification des conditions',
    body: [
      "Signal-Moi peut modifier les présentes conditions afin de tenir compte de l'évolution du service, de la réglementation, de la sécurité ou des besoins opérationnels.",
      "La version publiée sur la plateforme est celle applicable. L'utilisation continue de Signal-Moi après publication d'une nouvelle version vaut acceptation des conditions mises à jour."
    ]
  },
  {
    title: '15. Droit applicable et règlement des différends',
    body: [
      "Les présentes conditions sont régies par le droit sénégalais, sous réserve des règles impératives applicables.",
      "Tout différend doit d'abord faire l'objet d'une tentative de règlement amiable. À défaut d'accord, les juridictions compétentes du Sénégal pourront être saisies, sauf règle légale contraire."
    ]
  }
]

export default function Terms() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Conditions Générales d'Utilisation - Signal-Moi</title>
        <meta name="description" content="Conditions générales d'utilisation de la plateforme Signal-Moi." />
      </Head>

      <main className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-5 w-5" />
              Retour
            </button>
            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl md:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Signal-Moi</p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">Conditions Générales d'Utilisation</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Ces conditions expliquent les droits, devoirs et responsabilités liés à l'utilisation de la plateforme.
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-200">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="leading-7 text-slate-700">{paragraph}</p>
                  ))}
                </div>
                {section.link && (
                  <Link href={section.link.href} className="mt-4 inline-flex font-bold text-emerald-700 hover:text-emerald-800">
                    {section.link.label}
                  </Link>
                )}
              </section>
            ))}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">16. Contact</h2>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-700">
                <p><strong>Email :</strong> contact@signal-moi.sn</p>
                <p className="mt-2"><strong>Téléphone :</strong> +221 77 885 16 91</p>
                <p className="mt-2"><strong>Formulaire :</strong> <Link href="/contact" className="font-bold text-emerald-700 hover:underline">contacter Signal-Moi</Link></p>
              </div>
            </section>

            <p className="text-center text-sm text-slate-500">© {new Date().getFullYear()} Signal-Moi. Tous droits réservés.</p>
          </motion.div>
        </div>
      </main>
    </>
  )
}
