const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const SiteConfig = require('../models/SiteConfig');

const num = (value) => Number.parseInt(value || 0, 10);

const queryRows = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return result.rows || [];
  } catch (error) {
    console.warn('[statisticsReport] Query skipped:', error.message);
    return [];
  }
};

const getLogoPath = async () => {
  try {
    const config = await SiteConfig.getAll();
    const logoUrl = config.logoUrl || config.logo_url;
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return null;
    const resolved = path.resolve(__dirname, '..', '..', logoUrl.replace(/^\/uploads\//, 'uploads/'));
    return fs.existsSync(resolved) ? resolved : null;
  } catch (error) {
    return null;
  }
};

const rowsToObject = (rows, keyField, valueField = 'count') => rows.reduce((acc, row) => {
  const key = row[keyField] || 'Non renseigne';
  acc[key] = num(row[valueField]);
  return acc;
}, {});

const getCompleteStatistics = async ({ scope = 'admin', userId = null } = {}) => {
  const collaboratorFilter = scope === 'collaborator' ? "WHERE s.statut != 'ferme' AND s.statut != 'fermé'" : '';
  const campaignFilter = scope === 'collaborator' ? 'WHERE created_by = $1' : '';
  const campaignParams = scope === 'collaborator' ? [userId] : [];

  const [
    totalsRows,
    byStatusRows,
    byTypeRows,
    byZoneRows,
    monthlyRows,
    usersByRoleRows,
    campaignRows,
    plaidoyerRows,
    recentRows
  ] = await Promise.all([
    queryRows(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE statut = 'nouveau') AS nouveaux,
        COUNT(*) FILTER (WHERE statut = 'en_cours') AS en_cours,
        COUNT(*) FILTER (WHERE statut = 'traite') AS traites,
        COUNT(*) FILTER (WHERE statut = 'transfere') AS transferes,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS avec_gps,
        COUNT(*) FILTER (WHERE est_anonyme = true) AS anonymes
      FROM signal_moi.signalements s
      ${collaboratorFilter}
    `),
    queryRows(`SELECT COALESCE(statut, 'non_renseigne') AS statut, COUNT(*) AS count FROM signal_moi.signalements s ${collaboratorFilter} GROUP BY statut ORDER BY count DESC`),
    queryRows(`SELECT COALESCE(type, 'non_renseigne') AS type, COUNT(*) AS count FROM signal_moi.signalements s ${collaboratorFilter} GROUP BY type ORDER BY count DESC`),
    queryRows(`SELECT COALESCE(NULLIF(split_part(localisation, ',', 1), ''), 'Zone inconnue') AS zone, COUNT(*) AS count FROM signal_moi.signalements s ${collaboratorFilter} GROUP BY zone ORDER BY count DESC LIMIT 20`),
    queryRows(`SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*) AS count FROM signal_moi.signalements s ${collaboratorFilter} GROUP BY month ORDER BY month DESC LIMIT 12`),
    scope === 'admin' ? queryRows("SELECT COALESCE(role, 'non_renseigne') AS role, COUNT(*) AS count FROM signal_moi.users GROUP BY role ORDER BY count DESC") : Promise.resolve([]),
    queryRows(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE est_actif = true) AS actives FROM signal_moi.campagnes ${campaignFilter}`, campaignParams),
    queryRows('SELECT COUNT(*) AS total FROM signal_moi.plaidoyers'),
    queryRows(`SELECT titre, type, statut, localisation, created_at FROM signal_moi.signalements s ${collaboratorFilter} ORDER BY created_at DESC LIMIT 10`)
  ]);

  const totals = totalsRows[0] || {};
  return {
    generatedAt: new Date().toISOString(),
    scope,
    totals: {
      signalements: num(totals.total),
      nouveaux: num(totals.nouveaux),
      enCours: num(totals.en_cours),
      traites: num(totals.traites),
      transferes: num(totals.transferes),
      last24h: num(totals.last_24h),
      last7d: num(totals.last_7d),
      avecGps: num(totals.avec_gps),
      anonymes: num(totals.anonymes),
      campagnes: num(campaignRows[0]?.total),
      campagnesActives: num(campaignRows[0]?.actives),
      plaidoyers: num(plaidoyerRows[0]?.total)
    },
    byStatus: rowsToObject(byStatusRows, 'statut'),
    byType: rowsToObject(byTypeRows, 'type'),
    byZone: rowsToObject(byZoneRows, 'zone'),
    byMonth: monthlyRows.reverse().map((row) => ({ month: row.month, count: num(row.count) })),
    usersByRole: rowsToObject(usersByRoleRows, 'role'),
    recentSignalements: recentRows.map((row) => ({
      titre: row.titre,
      type: row.type,
      statut: row.statut,
      localisation: row.localisation,
      createdAt: row.created_at
    }))
  };
};

const addExcelRows = (sheet, title, entries) => {
  sheet.addRow([]);
  sheet.addRow([title]);
  entries.forEach(([label, value]) => sheet.addRow([label, value]));
};

const sendStatisticsExport = async (res, stats, format = 'excel') => {
  const logoPath = await getLogoPath();
  const filenameDate = new Date().toISOString().slice(0, 10);

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="statistiques-${stats.scope}-${filenameDate}.pdf"`);
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    if (logoPath) doc.image(logoPath, 40, 30, { fit: [70, 50] });
    doc.fontSize(20).text('Rapport complet des statistiques', logoPath ? 125 : 40, 40);
    doc.fontSize(9).fillColor('#666').text(`Genere le ${new Date(stats.generatedAt).toLocaleString('fr-FR')}`);
    doc.moveDown(2).fillColor('#111').fontSize(13).text('Indicateurs principaux');
    Object.entries(stats.totals).forEach(([label, value]) => doc.fontSize(10).text(`${label}: ${value}`));
    doc.moveDown().fontSize(13).text('Par statut');
    Object.entries(stats.byStatus).forEach(([label, value]) => doc.fontSize(10).text(`${label}: ${value}`));
    doc.moveDown().fontSize(13).text('Par type');
    Object.entries(stats.byType).forEach(([label, value]) => doc.fontSize(10).text(`${label}: ${value}`));
    doc.moveDown().fontSize(13).text('Par zone');
    Object.entries(stats.byZone).forEach(([label, value]) => doc.fontSize(10).text(`${label}: ${value}`));
    doc.end();
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statistiques');
  sheet.columns = [{ header: 'Indicateur', key: 'label', width: 35 }, { header: 'Valeur', key: 'value', width: 25 }];
  if (logoPath) {
    const imageId = workbook.addImage({ filename: logoPath, extension: path.extname(logoPath).replace('.', '') || 'png' });
    sheet.addImage(imageId, 'A1:B4');
    sheet.getRow(1).height = 55;
    sheet.addRow([]);
    sheet.addRow([]);
  }
  sheet.addRow(['Rapport complet des statistiques', `Genere le ${new Date(stats.generatedAt).toLocaleString('fr-FR')}`]);
  addExcelRows(sheet, 'Indicateurs principaux', Object.entries(stats.totals));
  addExcelRows(sheet, 'Par statut', Object.entries(stats.byStatus));
  addExcelRows(sheet, 'Par type', Object.entries(stats.byType));
  addExcelRows(sheet, 'Par zone', Object.entries(stats.byZone));
  addExcelRows(sheet, 'Par mois', stats.byMonth.map((row) => [row.month, row.count]));
  if (stats.scope === 'admin') addExcelRows(sheet, 'Utilisateurs par role', Object.entries(stats.usersByRole));
  sheet.getColumn(1).font = { bold: false };
  sheet.eachRow((row) => {
    if (row.getCell(1).value && !row.getCell(2).value) row.font = { bold: true };
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="statistiques-${stats.scope}-${filenameDate}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = { getCompleteStatistics, sendStatisticsExport };
