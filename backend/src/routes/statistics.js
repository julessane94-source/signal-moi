const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth')
const db = require('../config/database')

const checkAdminOrCollaborator = (req, res, next) => {
  if (!req.user || !['admin', 'collaborateur'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acces refuse - admin ou collaborateur requis' })
  }
  next()
}

const toInt = (value) => parseInt(value || 0, 10)

const hasColumn = async (tableName, columnName) => {
  const result = await db.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3 LIMIT 1',
    ['signal_moi', tableName, columnName]
  )
  return result.rows.length > 0
}

const optionalDateWhere = ({ startDate, endDate, type }, params) => {
  const where = []

  if (startDate) {
    params.push(startDate)
    where.push(`s.created_at >= $${params.length}`)
  }

  if (endDate) {
    params.push(endDate)
    where.push(`s.created_at < ($${params.length}::date + INTERVAL '1 day')`)
  }

  if (type && type !== 'all') {
    params.push(type)
    where.push(`s.type = $${params.length}`)
  }

  return where.length ? `WHERE ${where.join(' AND ')}` : ''
}

router.get('/by-type', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.type, COUNT(*)::int AS count
      FROM signal_moi.signalements s
      GROUP BY s.type
      ORDER BY count DESC, s.type ASC
    `)

    res.json({ success: true, data: result.rows.map(row => ({ ...row, count: toInt(row.count) })) })
  } catch (error) {
    console.error('Erreur statistiques par type:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

router.get('/by-month', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear()
    const result = await db.query(`
      SELECT TO_CHAR(s.created_at, 'YYYY-MM') AS month, s.type, COUNT(*)::int AS count
      FROM signal_moi.signalements s
      WHERE s.created_at >= $1::date
        AND s.created_at < ($2::date + INTERVAL '1 year')
      GROUP BY TO_CHAR(s.created_at, 'YYYY-MM'), s.type
      ORDER BY month ASC, s.type ASC
    `, [`${year}-01-01`, `${year}-01-01`])

    const monthlyData = {}
    result.rows.forEach(row => {
      if (!monthlyData[row.month]) monthlyData[row.month] = { month: row.month, total: 0, byType: {} }
      const count = toInt(row.count)
      monthlyData[row.month].byType[row.type] = count
      monthlyData[row.month].total += count
    })

    res.json({ success: true, year, data: Object.values(monthlyData) })
  } catch (error) {
    console.error('Erreur statistiques par mois:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

router.get('/by-gender', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const hasGenre = await db.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'signal_moi'
        AND table_name = 'users'
        AND column_name = 'genre'
      LIMIT 1
    `)

    if (!hasGenre.rows.length) {
      return res.json({ success: true, data: [] })
    }

    const result = await db.query(`
      SELECT COALESCE(u.genre, 'Non specifie') AS genre, s.type, COUNT(*)::int AS count
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      GROUP BY COALESCE(u.genre, 'Non specifie'), s.type
      ORDER BY genre ASC, s.type ASC
    `)

    res.json({ success: true, data: result.rows.map(row => ({ ...row, count: toInt(row.count) })) })
  } catch (error) {
    console.error('Erreur statistiques par sexe:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

router.get('/by-age', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const hasBirthDate = await db.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'signal_moi'
        AND table_name = 'users'
        AND column_name = 'date_naissance'
      LIMIT 1
    `)

    if (!hasBirthDate.rows.length) {
      return res.json({ success: true, data: [] })
    }

    const result = await db.query(`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 18 THEN 'Moins de 18 ans'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 25 THEN '18-25 ans'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 35 THEN '25-35 ans'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 45 THEN '35-45 ans'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 55 THEN '45-55 ans'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_naissance)) < 65 THEN '55-65 ans'
          ELSE 'Plus de 65 ans'
        END AS age_group,
        s.type,
        COUNT(*)::int AS count
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE u.date_naissance IS NOT NULL
      GROUP BY age_group, s.type
      ORDER BY
        CASE age_group
          WHEN 'Moins de 18 ans' THEN 1
          WHEN '18-25 ans' THEN 2
          WHEN '25-35 ans' THEN 3
          WHEN '35-45 ans' THEN 4
          WHEN '45-55 ans' THEN 5
          WHEN '55-65 ans' THEN 6
          WHEN 'Plus de 65 ans' THEN 7
        END,
        s.type ASC
    `)

    res.json({ success: true, data: result.rows.map(row => ({ ...row, count: toInt(row.count) })) })
  } catch (error) {
    console.error('Erreur statistiques par age:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

router.get('/overview', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const hasPriorite = await hasColumn('signalements', 'priorite')
    const hasStatut = await hasColumn('signalements', 'statut')
    const statutExpr = hasStatut ? "COALESCE(s.statut, 'nouveau')" : "'nouveau'"
    const prioriteExpr = hasPriorite ? "COALESCE(s.priorite, 'normale')" : "'normale'"

    const [totalRes, statusRes, typeRes, priorityRes, monthlyRes] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM signal_moi.signalements'),
      db.query(`
        SELECT ${statutExpr} AS statut, COUNT(*)::int AS count
        FROM signal_moi.signalements s
        GROUP BY ${statutExpr}
        ORDER BY count DESC
      `),
      db.query(`
        SELECT s.type, COUNT(*)::int AS count
        FROM signal_moi.signalements s
        GROUP BY s.type
        ORDER BY count DESC, s.type ASC
        LIMIT 5
      `),
      db.query(`
        SELECT ${prioriteExpr} AS priorite, COUNT(*)::int AS count
        FROM signal_moi.signalements s
        GROUP BY ${prioriteExpr}
        ORDER BY count DESC
      `),
      db.query(`
        SELECT TO_CHAR(s.created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
        FROM signal_moi.signalements s
        WHERE s.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(s.created_at, 'YYYY-MM')
        ORDER BY month ASC
      `)
    ])

    res.json({
      success: true,
      totalSignalements: toInt(totalRes.rows[0]?.total),
      statusDistribution: statusRes.rows.map(row => ({ ...row, count: toInt(row.count) })),
      topTypes: typeRes.rows.map(row => ({ ...row, count: toInt(row.count) })),
      priorityDistribution: priorityRes.rows.map(row => ({ ...row, count: toInt(row.count) })),
      monthlyTrend: monthlyRes.rows.map(row => ({ ...row, count: toInt(row.count) }))
    })
  } catch (error) {
    console.error('Erreur statistiques overview:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

router.get('/export-data', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const params = []
    const whereClause = optionalDateWhere(req.query, params)
    const hasBirthDate = await hasColumn('users', 'date_naissance')
    const hasPriorite = await hasColumn('signalements', 'priorite')
    const hasStatut = await hasColumn('signalements', 'statut')
    const birthDateSelect = hasBirthDate ? 'u.date_naissance' : 'NULL AS date_naissance'
    const prioriteSelect = hasPriorite ? "COALESCE(s.priorite, 'normale')" : "'normale'"
    const statutSelect = hasStatut ? "COALESCE(s.statut, 'nouveau')" : "'nouveau'"

    const result = await db.query(`
      SELECT
        s.id,
        s.titre,
        s.type,
        ${statutSelect} AS statut,
        ${prioriteSelect} AS priorite,
        s.created_at,
        u.prenom,
        u.nom,
        ${birthDateSelect}
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT 10000
    `, params)

    const stats = {
      total: result.rows.length,
      byType: {},
      byMonth: {},
      byAge: {},
      byStatus: {}
    }

    result.rows.forEach(row => {
      stats.byType[row.type] = (stats.byType[row.type] || 0) + 1
      stats.byStatus[row.statut] = (stats.byStatus[row.statut] || 0) + 1

      const month = row.created_at ? new Date(row.created_at).toISOString().slice(0, 7) : 'Non date'
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1

      if (row.date_naissance) {
        const age = new Date().getFullYear() - new Date(row.date_naissance).getFullYear()
        const ageGroup = age < 18 ? 'Moins de 18 ans' :
          age < 25 ? '18-25 ans' :
          age < 35 ? '25-35 ans' :
          age < 45 ? '35-45 ans' :
          age < 55 ? '45-55 ans' :
          age < 65 ? '55-65 ans' : 'Plus de 65 ans'
        stats.byAge[ageGroup] = (stats.byAge[ageGroup] || 0) + 1
      }
    })

    res.json({
      success: true,
      stats,
      signalements: result.rows.map(row => ({
        id: row.id,
        titre: row.titre,
        type: row.type,
        statut: row.statut,
        priorite: row.priorite,
        created_at: row.created_at,
        userName: row.prenom || row.nom ? `${row.prenom || ''} ${row.nom || ''}`.trim() : 'Anonyme'
      }))
    })
  } catch (error) {
    console.error('Erreur export donnees:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

module.exports = router
