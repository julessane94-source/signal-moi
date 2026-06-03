const express = require('express')
const router = express.Router()
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')
const { Signalement, User } = require('../models')
const { sequelize } = require('../models')
const { Op, fn, col, literal } = require('sequelize')

// Middleware pour vérifier admin ou collaborateur
const checkAdminOrCollaborator = (req, res, next) => {
  if (!req.user || !['admin', 'collaborateur'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé - admin ou collaborateur requis' })
  }
  next()
}

// Récupérer statistiques par type de signalement
router.get('/by-type', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const stats = await Signalement.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
        [fn('AVG', col('priorite')), 'avg_priorite']
      ],
      group: ['type'],
      raw: true,
      subQuery: false
    })

    res.json({
      success: true,
      data: stats.map(s => ({
        ...s,
        count: parseInt(s.count)
      }))
    })
  } catch (error) {
    console.error('Erreur statistiques par type:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer statistiques par mois
router.get('/by-month', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const { year } = req.query
    const currentYear = year || new Date().getFullYear()

    const stats = await Signalement.findAll({
      attributes: [
        [sequelize.literal(`TO_CHAR(created_at, 'YYYY-MM')`), 'month'],
        'type',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(`${currentYear}-01-01`),
          [Op.lt]: new Date(`${currentYear + 1}-01-01`)
        }
      },
      group: [sequelize.literal(`TO_CHAR(created_at, 'YYYY-MM')`), 'type'],
      order: [sequelize.literal(`TO_CHAR(created_at, 'YYYY-MM')`)],
      raw: true,
      subQuery: false
    })

    // Restructurer les données
    const monthlyData = {}
    stats.forEach(s => {
      if (!monthlyData[s.month]) {
        monthlyData[s.month] = { month: s.month, total: 0, byType: {} }
      }
      monthlyData[s.month].byType[s.type] = parseInt(s.count)
      monthlyData[s.month].total += parseInt(s.count)
    })

    res.json({
      success: true,
      year: currentYear,
      data: Object.values(monthlyData)
    })
  } catch (error) {
    console.error('Erreur statistiques par mois:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer statistiques par sexe
router.get('/by-gender', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        COALESCE(u.genre, 'Non spécifié') as genre,
        s.type,
        COUNT(s.id) as count,
        ROUND(AVG(EXTRACT(YEAR FROM AGE(DATE(u.date_naissance)))), 0) as avg_age
      FROM signalements s
      LEFT JOIN users u ON s.user_id = u.id
      GROUP BY u.genre, s.type
      ORDER BY u.genre, s.type
    `, { type: sequelize.QueryTypes.SELECT })

    res.json({
      success: true,
      data: stats.map(s => ({
        ...s,
        count: parseInt(s.count),
        avg_age: s.avg_age ? parseFloat(s.avg_age) : null
      }))
    })
  } catch (error) {
    console.error('Erreur statistiques par sexe:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer statistiques par âge (tranches)
router.get('/by-age', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        CASE
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 18 THEN 'Moins de 18 ans'
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 25 THEN '18-25 ans'
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 35 THEN '25-35 ans'
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 45 THEN '35-45 ans'
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 55 THEN '45-55 ans'
          WHEN EXTRACT(YEAR FROM AGE(DATE(u.date_naissance))) < 65 THEN '55-65 ans'
          ELSE 'Plus de 65 ans'
        END as age_group,
        s.type,
        COUNT(s.id) as count
      FROM signalements s
      LEFT JOIN users u ON s.user_id = u.id
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
        s.type
    `, { type: sequelize.QueryTypes.SELECT })

    res.json({
      success: true,
      data: stats.map(s => ({
        ...s,
        count: parseInt(s.count)
      }))
    })
  } catch (error) {
    console.error('Erreur statistiques par âge:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer statistiques globales
router.get('/overview', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const totalSignalements = await Signalement.count()
    
    const statusStats = await Signalement.findAll({
      attributes: [
        'statut',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['statut'],
      raw: true
    })

    const typeStats = await Signalement.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['type'],
      raw: true,
      limit: 5,
      order: [[sequelize.literal('COUNT(id)'), 'DESC']]
    })

    const priorityStats = await Signalement.findAll({
      attributes: [
        'priorite',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['priorite'],
      raw: true
    })

    const monthlyTrendQuery = await sequelize.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(id) as count
      FROM signalements
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `, { type: sequelize.QueryTypes.SELECT })

    res.json({
      success: true,
      totalSignalements,
      statusDistribution: statusStats.map(s => ({
        ...s,
        count: parseInt(s.count)
      })),
      topTypes: typeStats.map(s => ({
        ...s,
        count: parseInt(s.count)
      })),
      priorityDistribution: priorityStats.map(s => ({
        ...s,
        count: parseInt(s.count)
      })),
      monthlyTrend: monthlyTrendQuery.map(s => ({
        ...s,
        count: parseInt(s.count)
      }))
    })
  } catch (error) {
    console.error('Erreur statistiques overview:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer données détaillées pour PDF
router.get('/export-data', authMiddleware, checkAdminOrCollaborator, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query

    let whereClause = {}
    if (startDate || endDate) {
      whereClause.created_at = {}
      if (startDate) whereClause.created_at[Op.gte] = new Date(startDate)
      if (endDate) whereClause.created_at[Op.lte] = new Date(endDate)
    }
    if (type && type !== 'all') {
      whereClause.type = type
    }

    const signalements = await Signalement.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['prenom', 'nom', 'genre', 'date_naissance'] }],
      limit: 10000
    })

    // Calculer les statistiques
    const stats = {
      total: signalements.length,
      byType: {},
      byMonth: {},
      byGender: {},
      byAge: {},
      byStatus: {}
    }

    signalements.forEach(s => {
      // Par type
      stats.byType[s.type] = (stats.byType[s.type] || 0) + 1

      // Par mois
      const month = s.created_at.toISOString().slice(0, 7)
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1

      // Par sexe
      const gender = s.User?.genre || 'Non spécifié'
      stats.byGender[gender] = (stats.byGender[gender] || 0) + 1

      // Par âge
      if (s.User?.date_naissance) {
        const age = new Date().getFullYear() - new Date(s.User.date_naissance).getFullYear()
        const ageGroup = age < 18 ? 'Moins de 18 ans' :
                        age < 25 ? '18-25 ans' :
                        age < 35 ? '25-35 ans' :
                        age < 45 ? '35-45 ans' :
                        age < 55 ? '45-55 ans' :
                        age < 65 ? '55-65 ans' : 'Plus de 65 ans'
        stats.byAge[ageGroup] = (stats.byAge[ageGroup] || 0) + 1
      }

      // Par statut
      stats.byStatus[s.statut] = (stats.byStatus[s.statut] || 0) + 1
    })

    res.json({
      success: true,
      stats,
      signalements: signalements.map(s => ({
        id: s.id,
        titre: s.titre,
        type: s.type,
        statut: s.statut,
        priorite: s.priorite,
        created_at: s.created_at,
        userName: s.User ? `${s.User.prenom} ${s.User.nom}` : 'Anonyme'
      }))
    })
  } catch (error) {
    console.error('Erreur export données:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
