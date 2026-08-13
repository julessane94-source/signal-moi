import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const articles = {
  'lancer-campagne': {
    title: 'Lancer une campagne de sensibilisation efficace',
    category: 'Guide',
    icon: '🎯',
    lead: 'Une campagne claire mobilise plus facilement les habitants et les partenaires.',
    sections: [
      ['1. Définir un objectif', 'Choisissez un problème précis, un public et un résultat mesurable : informer, recruter ou faire participer.'],
      ['2. Préparer un message simple', 'Utilisez un titre court, une date, un lieu et une action attendue. Gardez une seule idée principale par publication.'],
      ['3. Choisir les bons canaux', 'Partagez la campagne dans Signal-Moi, auprès des relais locaux et sur les canaux utilisés par votre communauté.'],
      ['4. Suivre et améliorer', 'Observez les inscriptions, les retours et les participations. Ajustez le message ou le calendrier si nécessaire.']
    ]
  },
  'signaler-securite': {
    title: 'Comment signaler un problème de sécurité publique',
    category: 'Tutoriel',
    icon: '🔒',
    lead: 'Un bon signalement aide les équipes à comprendre la situation et à intervenir plus vite.',
    sections: [
      ['Décrire les faits', 'Indiquez ce qui se passe, sans supposer ni désigner une personne sans certitude.'],
      ['Préciser le lieu', 'Partagez votre position GPS ou indiquez un repère clair.'],
      ['Ajouter une preuve', 'Joignez une photo, un audio ou une vidéo seulement si cela ne vous met pas en danger.'],
      ['Suivre le dossier', 'Consultez le statut depuis votre tableau de bord après l’envoi.']
    ]
  },
  'temoignage-quartier': {
    title: 'Témoignage : Signal-Moi et notre quartier',
    category: 'Témoignage',
    icon: '💬',
    lead: 'Quand les habitants, collaborateurs et services compétents partagent la même information, les actions locales deviennent plus simples à suivre.',
    sections: [
      ['Un problème visible', 'Les habitants ont documenté une situation et l’ont localisée clairement.'],
      ['Une réponse coordonnée', 'Les acteurs concernés ont pu suivre le dossier et faire remonter les avancées.'],
      ['Un suivi partagé', 'La communauté peut ensuite constater l’évolution du signalement et poursuivre le dialogue.']
    ]
  },
  'top-signalements-2025': {
    title: 'Les signalements les plus impactants de 2025',
    category: 'Actualités',
    icon: '⭐',
    lead: 'Les signalements les plus utiles sont précis, localisés et suivis jusqu’à leur traitement.',
    sections: [
      ['Ce qui crée de l’impact', 'Des informations claires, une localisation fiable et une communication respectueuse.'],
      ['Ce que nous retenons', 'Chaque dossier permet de mieux repérer les priorités récurrentes dans les quartiers.'],
      ['Continuer à agir', 'Utilisez Signal-Moi pour déclarer, suivre et relayer les situations qui nécessitent une attention.']
    ]
  },
  'proteger-vie-privee': {
    title: 'Protéger votre vie privée sur Signal-Moi',
    category: 'Sécurité',
    icon: '🔐',
    lead: 'Partagez uniquement les informations utiles au traitement de votre signalement.',
    sections: [
      ['Limiter les données personnelles', 'Évitez d’ajouter des informations sensibles qui ne sont pas nécessaires au dossier.'],
      ['Vérifier les preuves', 'Avant d’envoyer une image ou une vidéo, vérifiez qu’elle ne révèle pas inutilement l’identité d’autres personnes.'],
      ['Choisir le bon niveau de détail', 'Indiquez le lieu et les faits avec précision, tout en restant prudent pour votre sécurité.']
    ]
  }
}

export default function BlogArticle() {
  const router = useRouter()
  const article = articles[router.query.slug]

  if (!router.isReady) return null
  if (!article) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Article introuvable</h1>
          <Link href="/blog" className="mt-5 inline-flex rounded-full bg-indigo-600 px-5 py-3 font-bold text-white">Voir le blog</Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head><title>{article.title} - Signal-Moi</title><meta name="description" content={article.lead} /></Head>
      <main className="min-h-screen bg-slate-50 pb-16 pt-24">
        <article className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link href="/blog" className="text-sm font-bold text-indigo-700 hover:text-indigo-900">← Retour au blog</Link>
          <header className="page-hero-animated mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 p-7 text-white shadow-xl sm:p-10">
            <div className="hero-copy-enter">
              <span className="text-5xl" aria-hidden="true">{article.icon}</span>
              <p className="mt-5 text-sm font-bold uppercase tracking-[.2em] text-indigo-100">{article.category}</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{article.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-indigo-100">{article.lead}</p>
            </div>
          </header>
          <div className="card-stagger mt-8 space-y-4">
            {article.sections.map(([title, text], index) => (
              <section key={title} style={{ '--card-index': index }} className="interactive-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </section>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-center">
            <p className="font-bold text-slate-900">Prêt à agir dans votre communauté ?</p>
            <Link href="/campagnes" className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">Voir les campagnes</Link>
          </div>
        </article>
      </main>
    </>
  )
}
