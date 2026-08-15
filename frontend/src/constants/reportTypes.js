export const REPORT_TYPES = [
  { value: 'violence', label: 'Violence', icon: '🚨', hint: 'Agression, menace ou bagarre', tone: 'border-red-200 bg-red-50 text-red-900', description: 'Je signale une violence ou une menace. Il faut intervenir rapidement.' },
  { value: 'vol', label: 'Vol', icon: '👜', hint: 'Vol, cambriolage ou objet perdu', tone: 'border-amber-200 bg-amber-50 text-amber-900', description: 'Je signale un vol. Une personne a perdu un bien ou un cambriolage a eu lieu.' },
  { value: 'accident', label: 'Accident', icon: '🚗', hint: 'Choc, blessure ou danger', tone: 'border-orange-200 bg-orange-50 text-orange-900', description: 'Je signale un accident ou une personne en danger. Il faut intervenir rapidement.' },
  { value: 'probleme_eclairage', label: 'Éclairage', icon: '💡', hint: 'Rue sombre ou lampe en panne', tone: 'border-blue-200 bg-blue-50 text-blue-900', description: 'Je signale un problème d’éclairage public. La zone est sombre ou dangereuse.' },
  { value: 'nid_de_poule', label: 'Nid de poule', icon: '🕳️', hint: 'Route abîmée ou trou', tone: 'border-slate-200 bg-slate-50 text-slate-900', description: 'Je signale un trou ou une route abîmée. Cela peut provoquer un accident.' },
  { value: 'dechet', label: 'Déchets', icon: '🗑️', hint: 'Dépôt ou collecte à traiter', tone: 'border-lime-200 bg-lime-50 text-lime-900', description: 'Je signale des déchets ou un dépôt à traiter dans le quartier.' },
  { value: 'eau_sale', label: 'Eau sale', icon: '💧', hint: 'Eaux usées ou insalubrité', tone: 'border-cyan-200 bg-cyan-50 text-cyan-900', description: 'Je signale une eau sale ou une situation d’insalubrité.' },
  { value: 'bruit', label: 'Bruit', icon: '🔊', hint: 'Nuisance sonore', tone: 'border-violet-200 bg-violet-50 text-violet-900', description: 'Je signale une nuisance sonore qui affecte le voisinage.' },
  { value: 'insecurite', label: 'Insécurité', icon: '🛡️', hint: 'Zone ou situation à risque', tone: 'border-red-200 bg-red-50 text-red-900', description: 'Je signale une situation d’insécurité dans le quartier.' },
  { value: 'sante', label: 'Santé', icon: '⚕️', hint: 'Risque ou besoin sanitaire', tone: 'border-rose-200 bg-rose-50 text-rose-900', description: 'Je signale un problème de santé ou un risque sanitaire.' },
  { value: 'education', label: 'Éducation', icon: '📚', hint: 'Besoin lié à l’école', tone: 'border-indigo-200 bg-indigo-50 text-indigo-900', description: 'Je signale un besoin ou un problème lié à l’éducation.' },
  { value: 'electricite', label: 'Électricité', icon: '⚡', hint: 'Panne ou danger électrique', tone: 'border-yellow-200 bg-yellow-50 text-yellow-900', description: 'Je signale une panne ou un danger lié à l’électricité.' },
  { value: 'eau_potable', label: 'Eau potable', icon: '🚰', hint: 'Accès ou coupure d’eau', tone: 'border-sky-200 bg-sky-50 text-sky-900', description: 'Je signale un problème d’accès à l’eau potable.' },
  { value: 'transport', label: 'Transport', icon: '🚌', hint: 'Déplacement ou arrêt à améliorer', tone: 'border-teal-200 bg-teal-50 text-teal-900', description: 'Je signale un problème de transport dans la zone.' },
  { value: 'environnement', label: 'Environnement', icon: '🌍', hint: 'Pollution ou cadre de vie', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900', description: 'Je signale un problème environnemental dans le quartier.' },
  { value: 'autre', label: 'Autre', icon: '❓', hint: 'Autre problème local', tone: 'border-slate-200 bg-slate-50 text-slate-900', description: 'Je signale un problème dans mon quartier. Merci de vérifier la situation.' }
]
