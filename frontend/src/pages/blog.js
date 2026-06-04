import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon as ArrowLeft, CalendarIcon as Calendar, UserIcon as User } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

export default function Blog() {
  const router = useRouter()

  const blogPosts = [
    {
      id: 1,
      title: 'Lancer une Campagne de Sensibilisation Efficace',
      excerpt: 'Découvrez les meilleures pratiques pour créer une campagne qui engage votre communauté et génère le changement.',
      author: 'Équipe Signal-Moi',
      date: '2026-06-01',
      category: 'Guides',
      image: '🎯'
    },
    {
      id: 2,
      title: 'Comment Signaler un Problème de Sécurité Publique',
      excerpt: 'Un guide complet pour faire un signalement efficace avec photos, localisation et descriptions détaillées.',
      author: 'Équipe Signal-Moi',
      date: '2026-05-28',
      category: 'Tutoriels',
      image: '🔒'
    },
    {
      id: 3,
      title: 'Témoignage : Comment Signal-Moi a Changé Notre Quartier',
      excerpt: 'Les habitants d\'un quartier partagent comment la plateforme a permis de résoudre des problèmes locaux importants.',
      author: 'Communauté',
      date: '2026-05-25',
      category: 'Témoignages',
      image: '💬'
    },
    {
      id: 4,
      title: 'Les Dix Signalements Les Plus Impactants de 2025',
      excerpt: 'Découvrez les signalements qui ont changé les choses dans les communautés à travers le pays.',
      author: 'Équipe Signal-Moi',
      date: '2026-05-20',
      category: 'Actualités',
      image: '⭐'
    },
    {
      id: 5,
      title: 'Comprendre les Rôles : Citoyens, Collaborateurs et Police',
      excerpt: 'Explications sur comment les différents rôles travaillent ensemble pour améliorer les services publics.',
      author: 'Équipe Signal-Moi',
      date: '2026-05-15',
      category: 'Guides',
      image: '👥'
    },
    {
      id: 6,
      title: 'Protéger Votre Vie Privée sur Signal-Moi',
      excerpt: 'Conseils pratiques pour maintenir votre confidentialité tout en contribuant à l\'amélioration de votre communauté.',
      author: 'Équipe Signal-Moi',
      date: '2026-05-10',
      category: 'Sécurité',
      image: '🔐'
    }
  ]

  const categories = ['Tous', 'Guides', 'Tutoriels', 'Témoignages', 'Actualités', 'Sécurité']

  return (
    <>
      <Head>
        <title>Blog - Signal-Moi</title>
        <meta name="description" content="Actualités, guides et tutoriels de Signal-Moi" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Blog Signal-Moi
            </h1>
            <p className="text-gray-600">
              Actualités, guides pratiques et témoignages de notre communauté
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-wrap gap-3"
          >
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  cat === 'Tous'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-indigo-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {blogPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Post Image */}
                <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl">
                  {post.image}
                </div>

                {/* Post Content */}
                <div className="p-6">
                  {/* Category */}
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full mb-3">
                    {post.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                  </div>

                  {/* Read More */}
                  <button className="mt-4 w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                    Lire l'article
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Newsletter Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white text-center"
          >
            <h2 className="text-3xl font-bold mb-2">Recevez nos Actualités</h2>
            <p className="mb-6 text-indigo-100">
              Abonnez-vous à notre newsletter pour rester informé des dernières actualités et guides
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email..."
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                S'abonner
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </>
  )
}
