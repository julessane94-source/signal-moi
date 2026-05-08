// Usage: node seed_signalements.js "postgresql://user:pass@host:5432/db"

if (!process.argv[2]) {
  console.error('Usage: node seed_signalements.js <DATABASE_URL>')
  process.exit(2)
}

process.env.DATABASE_URL = process.argv[2]

console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:(.*)@/, ':*****@'))

;(async () => {
  try {
    const models = require('../backend/src/models')
    const { db, User, Signalement, Fichier } = models
    const schema = 'signal_moi'

    console.log('Ensuring schema exists and setting search_path')
    await db.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    await db.query(`SET search_path TO "${schema}", public`)

    console.log('Creating sample users...')
    // create or find users
    const usersData = [
      { prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@example.com', telephone: '0601020304', password: 'hashed', ville: 'Paris', quartier: 'Belleville', role: 'citoyen' },
      { prenom: 'Alice', nom: 'Martin', email: 'alice.martin@example.com', telephone: '0605060708', password: 'hashed', ville: 'Lyon', quartier: 'Part-Dieu', role: 'police' }
    ]

    const createdUsers = []
    for (const u of usersData) {
      const [user, created] = await User.schema(schema).findOrCreate({ where: { email: u.email }, defaults: u })
      createdUsers.push(user)
    }

    console.log('Creating sample signalements...')
    const signalementsData = [
      {
        titre: 'Nid-de-poule dangereux',
        description: 'Un énorme nid-de-poule au carrefour principal, risque d’accident.',
        type: 'nid_de_poule',
        statut: 'nouveau',
        localisation: 'Place de la République, Paris',
        userId: createdUsers[0].id
      },
      {
        titre: 'Éclairage public défaillant',
        description: "Lampadaires éteints depuis 2 semaines dans ma rue",
        type: 'probleme_eclairage',
        statut: 'en_cours',
        localisation: 'Rue de la Paix, Lyon',
        userId: createdUsers[1].id
      }
    ]

    const createdSignals = []
    for (const s of signalementsData) {
      const sig = await Signalement.schema(schema).create(s)
      createdSignals.push(sig)
    }

    console.log('Optionnel: ajouter fichiers associés...')
    await Fichier.schema(schema).bulkCreate([
      { nomFichier: 'photo1.jpg', chemin: 'uploads/signalements/photo1.jpg', type: 'image', taille: 123456, mimeType: 'image/jpeg', signalementId: createdSignals[0].id },
      { nomFichier: 'photo2.jpg', chemin: 'uploads/signalements/photo2.jpg', type: 'image', taille: 234567, mimeType: 'image/jpeg', signalementId: createdSignals[1].id }
    ])

    console.log('Seed complete:')
    console.log('- Users:', createdUsers.map(u=>({id:u.id,email:u.email})))
    console.log('- Signalements:', createdSignals.map(s=>({id:s.id,titre:s.titre})))

    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
})()
