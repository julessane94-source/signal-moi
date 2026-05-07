const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

// Possible config locations (try src/config first, then config/)
const cfgPaths = [
  path.join(__dirname, '..', 'config', 'siteConfig.json'),
  path.join(__dirname, '..', '..', 'config', 'siteConfig.json')
]

function readConfig() {
  for (const p of cfgPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn('Erreur lecture config', p, e.message)
    }
  }
  return { title: 'Signal-Moi', contactEmail: 'contact@signal-moi.com', phone: '+237 600 000 000', address: 'Yaounde, Cameroun', mapEnabled: false }
}

// Public GET /api/config
router.get('/', (req, res) => {
  try {
    const cfg = readConfig()
    res.json(cfg)
  } catch (error) {
    console.error(error)
    res.status(500).json({})
  }
})

module.exports = router
