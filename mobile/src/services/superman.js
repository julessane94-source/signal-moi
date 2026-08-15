const KNOWLEDGE = [
  {
    id: 'signalement',
    keywords: ['signalement', 'signaler', 'incident', 'danger', 'photo', 'video', 'preuve', 'localisation', 'gps'],
    answer: [
      'Choisissez le gros bouton qui ressemble au probleme.',
      'Autorisez la position GPS pour que la police voie le bon lieu.',
      'Ajoutez une photo, une video ou quelques mots simples.',
      'Si c est urgent, utilisez le live.'
    ]
  },
  {
    id: 'campagne',
    keywords: ['campagne', 'participer', 'inscrire', 'rejoindre', 'sensibilisation'],
    answer: [
      'Ouvrez Campagnes.',
      'Choisissez une campagne.',
      'Appuyez sur Participer.'
    ]
  },
  {
    id: 'police',
    keywords: ['police', 'urgence', 'live', 'direct', 'securite', 'violence', 'vol', 'accident'],
    answer: [
      'Les alertes urgentes arrivent dans l espace police.',
      'Les lives transmettent la localisation et les images en temps reel.',
      'Le bouton Intervenir permet de prendre le dossier en charge.'
    ]
  },
  {
    id: 'collaborateur',
    keywords: ['collaborateur', 'ong', 'association', 'statistique', 'rapport', 'export', 'plaidoyer'],
    answer: [
      'Le collaborateur suit les dossiers qui le concernent.',
      'Il consulte les statistiques completes.',
      'Il peut accompagner des campagnes et des plaidoyers.'
    ]
  },
  {
    id: 'admin',
    keywords: ['admin', 'administrateur', 'utilisateur', 'logo', 'configuration', 'site', 'statistiques'],
    answer: [
      'L administrateur gere les utilisateurs, le logo, les contenus et les statistiques.',
      'Le logo vient de la base de donnees.',
      'Les rapports statistiques peuvent etre exportes depuis le backend.'
    ]
  },
  {
    id: 'don',
    keywords: ['don', 'payer', 'paiement', 'wave', 'orange', 'money', 'soutenir'],
    answer: [
      'Le bouton Wave ouvre le lien marchand officiel.',
      'Orange Money peut utiliser le flux mobile ou le lien marchand lorsqu il est configure.',
      'Ne partagez jamais votre code secret.'
    ]
  }
]

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function getSupermanReply(text) {
  const clean = normalize(text)
  if (!clean) return 'Je suis SUPERMAN. Posez votre question sur Signal Moi avec vos mots.'
  if (/^(bonjour|salut|bonsoir|hello|salam)/.test(clean)) {
    return 'Bonjour. Je suis SUPERMAN, l assistant Signal Moi. Je peux aider pour signalement, campagne, police, statistiques, compte ou don.'
  }

  const best = KNOWLEDGE
    .map((item) => ({
      item,
      score: item.keywords.reduce((total, keyword) => total + (clean.includes(normalize(keyword)) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score)[0]

  if (!best || best.score === 0) {
    return 'Je ne suis pas encore sur. Essayez avec des mots comme signalement, campagne, police, statistiques, compte ou don.'
  }

  return best.item.answer.map((line, index) => `${index + 1}. ${line}`).join('\n')
}
