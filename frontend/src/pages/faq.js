import Head from 'next/head'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon as ArrowLeft, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

export default function FAQ() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      category: 'Compte & Inscription',
      questions: [
        {
          q: 'Comment créer un compte sur Signal-Moi ?',
          a: 'Cliquez sur "S\'inscrire" sur la page d\'accueil, remplissez le formulaire avec vos informations, puis confirmez votre email. Vous pouvez ensuite vous connecter avec vos identifiants.'
        },
        {
          q: 'Quels sont les différents rôles sur Signal-Moi ?',
          a: 'Il existe 4 rôles principaux : Citoyen (signalent les problèmes), Collaborateur (aident à résoudre les problèmes), Police (gèrent les signalements liés à la sécurité), et Administrateur (gère la plateforme).'
        },
        {
          q: 'Puis-je modifier mes informations de profil ?',
          a: 'Oui, vous pouvez mettre à jour votre profil dans les Paramètres. Cliquez sur votre avatar en haut à droite et sélectionnez "Paramètres".'
        },
        {
          q: 'Comment supprimer mon compte ?',
          a: 'Allez dans Paramètres > "Supprimer mon compte". Veuillez noter que cette action est permanente et vos données seront supprimées.'
        }
      ]
    },
    {
      category: 'Signalements',
      questions: [
        {
          q: 'Comment signaler un problème ?',
          a: 'Connectez-vous à votre compte, allez dans "Signalements" et cliquez sur "Nouveau Signalement". Décrivez le problème, ajoutez une localisation et des photos si possible, puis soumettez.'
        },
        {
          q: 'Puis-je inclure des photos dans mon signalement ?',
          a: 'Oui, vous pouvez ajouter jusqu\'à 5 photos par signalement. Cela aide à mieux documenter le problème et facilite sa résolution.'
        },
        {
          q: 'Comment modifier un signalement ?',
          a: 'Accédez au signalement et cliquez sur "Modifier". Vous pouvez mettre à jour la description, les photos et d\'autres détails jusqu\'à ce que le signalement soit marqué comme résolu.'
        },
        {
          q: 'Mes signalements sont-ils publics ?',
          a: 'Oui, vos signalements sont visibles par tous les utilisateurs de la plateforme, sauf si vous les marquez comme privés dans les paramètres du signalement.'
        }
      ]
    },
    {
      category: 'Campagnes',
      questions: [
        {
          q: 'Qu\'est-ce qu\'une campagne ?',
          a: 'Une campagne est une initiative collective visant à sensibiliser le public ou à mobiliser le soutien pour une cause spécifique. Vous pouvez créer ou rejoindre des campagnes.'
        },
        {
          q: 'Comment créer une campagne ?',
          a: 'Allez dans "Campagnes" et cliquez sur "Créer une Campagne". Définissez le titre, la description, l\'objectif et les détails, puis publiez-la.'
        },
        {
          q: 'Comment rejoindre une campagne ?',
          a: 'Parcourez les campagnes actives et cliquez sur "Rejoindre" pour ajouter votre soutien à la campagne.'
        },
        {
          q: 'Puis-je partager une campagne sur les réseaux sociaux ?',
          a: 'Oui, chaque campagne a un bouton de partage permettant de la diffuser sur Facebook, Twitter, WhatsApp et d\'autres plateformes.'
        }
      ]
    },
    {
      category: 'Plaidoyers',
      questions: [
        {
          q: 'Qu\'est-ce qu\'un plaidoyer ?',
          a: 'Un plaidoyer est un effort d\'advocacy pour influencer les décideurs et les politiques publiques. C\'est un moyen plus formel de promouvoir le changement.'
        },
        {
          q: 'Comment créer un plaidoyer ?',
          a: 'Allez dans "Plaidoyers" et cliquez sur "Créer un Plaidoyer". Définissez vos objectifs, les cibles (décideurs), et les actions recommandées.'
        },
        {
          q: 'Comment soutenir un plaidoyer ?',
          a: 'Cliquez sur "Soutenir" pour ajouter votre voix au plaidoyer. Vous pouvez également partager vos propres expériences et commentaires.'
        }
      ]
    },
    {
      category: 'Police & Sécurité',
      questions: [
        {
          q: 'Suis-je obligé de signaler un crime à la police via Signal-Moi ?',
          a: 'Non, Signal-Moi complète les canaux existants. Pour les urgences, contactez directement le numéro d\'urgence de votre pays.'
        },
        {
          q: 'Comment les signalements sont-ils traités par la police ?',
          a: 'Les signalements concernant la sécurité sont visibles aux autorités compétentes qui peuvent les examiner et prendre les actions appropriées.'
        },
        {
          q: 'Mes données sont-elles sûres sur Signal-Moi ?',
          a: 'Oui, Signal-Moi utilise le chiffrement et les protocoles de sécurité standards pour protéger vos informations personnelles.'
        }
      ]
    },
    {
      category: 'Confidentialité & Sécurité',
      questions: [
        {
          q: 'Qu\'advient-il de mes données si je supprime mon compte ?',
          a: 'Vos données personnelles sont supprimées, mais les signalements peuvent être conservés de manière anonyme à titre d\'archivage public.'
        },
        {
          q: 'Signal-Moi vend-il mes données à des tiers ?',
          a: 'Non, nous ne vendons jamais vos données à des fins commerciales. Consultez notre Politique de Confidentialité pour plus de détails.'
        },
        {
          q: 'Comment puis-je télécharger une copie de mes données ?',
          a: 'Allez dans Paramètres et demandez une copie de vos données. Vous recevrez un fichier avec toutes vos informations personnelles.'
        },
        {
          q: 'Signal-Moi utilise-t-il des cookies ?',
          a: 'Oui, nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer les cookies dans les paramètres de votre navigateur.'
        }
      ]
    },
    {
      category: 'Support & Aide',
      questions: [
        {
          q: 'Comment contacter le support client ?',
          a: 'Utilisez le formulaire de contact sur la page "Contact" ou envoyez un email à support@signal-moi.app. Nous répondons généralement dans les 24-48 heures.'
        },
        {
          q: 'La plateforme est en panne. Que faire ?',
          a: 'Vérifiez d\'abord votre connexion Internet. Si la plateforme est vraiment en panne, consultez notre page de statut ou contactez le support.'
        },
        {
          q: 'Puis-je signaler un bug ou une suggestion ?',
          a: 'Oui, utilisez le formulaire de contact pour signaler les bugs ou envoyez vos suggestions. Votre retour nous aide à améliorer la plateforme.'
        }
      ]
    }
  ]

  return (
    <>
      <Head>
        <title>FAQ - Signal-Moi</title>
        <meta name="description" content="Questions fréquemment posées sur Signal-Moi" />
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
              <ArrowLeft className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Questions Fréquemment Posées
            </h1>
            <p className="text-gray-600">Trouvez les réponses aux questions courantes sur Signal-Moi</p>
          </motion.div>

          {/* FAQ Content */}
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.category}</h2>
                <div className="space-y-3">
                  {section.questions.map((faq, qIndex) => {
                    const globalIndex = sectionIndex * 10 + qIndex
                    const isOpen = openIndex === globalIndex

                    return (
                      <motion.div
                        key={qIndex}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                        >
                          <h3 className="text-left text-gray-900 font-semibold">{faq.q}</h3>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-4 pb-4 border-t border-gray-200 text-gray-700">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
            <p className="mb-4 text-indigo-100">
              Contactez notre équipe de support, nous sommes là pour vous aider.
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-indigo-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Nous Contacter
            </a>
          </motion.div>
        </div>
      </div>
    </>
  )
}
