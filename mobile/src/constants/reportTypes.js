export const REPORT_TYPES = [
  { type: 'violence', label: 'Violence', icon: 'alert-circle', tone: '#dc2626' },
  { type: 'vol', label: 'Vol', icon: 'bag-handle', tone: '#a16207' },
  { type: 'accident', label: 'Accident', icon: 'car', tone: '#ea580c' },
  { type: 'probleme_eclairage', label: 'Éclairage', icon: 'bulb', tone: '#2563eb' },
  { type: 'nid_de_poule', label: 'Nid de poule', icon: 'construct', tone: '#475569' },
  { type: 'dechet', label: 'Déchets', icon: 'trash', tone: '#65a30d' },
  { type: 'eau_sale', label: 'Eau sale', icon: 'water', tone: '#0891b2' },
  { type: 'bruit', label: 'Bruit', icon: 'volume-high', tone: '#7c3aed' },
  { type: 'insecurite', label: 'Insécurité', icon: 'shield', tone: '#b91c1c' },
  { type: 'sante', label: 'Santé', icon: 'medkit', tone: '#e11d48' },
  { type: 'education', label: 'Éducation', icon: 'book', tone: '#4f46e5' },
  { type: 'electricite', label: 'Électricité', icon: 'flash', tone: '#ca8a04' },
  { type: 'eau_potable', label: 'Eau potable', icon: 'water-outline', tone: '#0284c7' },
  { type: 'transport', label: 'Transport', icon: 'bus', tone: '#0f766e' },
  { type: 'environnement', label: 'Environnement', icon: 'earth', tone: '#059669' },
  { type: 'autre', label: 'Autre', icon: 'help-circle', tone: '#475569' }
]

export const getReportTypeLabel = (type) => REPORT_TYPES.find((item) => item.type === type)?.label || type || 'Autre'
