import { createSignalement } from './api'
import { getOfflineReports, saveOfflineReports } from './storage'

function isNetworkError(error) {
  return !error?.response || error.code === 'ECONNABORTED' || error.message === 'Network Error'
}

export async function queueSignalement(payload) {
  const reports = await getOfflineReports()
  const queuedReport = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    payload
  }
  await saveOfflineReports([...reports, queuedReport])
  return queuedReport
}

export async function syncOfflineReports() {
  const reports = await getOfflineReports()
  if (!reports.length) return { sent: 0, pending: 0 }

  const remaining = []
  let sent = 0
  for (const report of reports) {
    try {
      await createSignalement(report.payload)
      sent += 1
    } catch (error) {
      remaining.push(report)
      if (isNetworkError(error)) {
        remaining.push(...reports.slice(reports.indexOf(report) + 1))
        break
      }
    }
  }
  await saveOfflineReports(remaining)
  return { sent, pending: remaining.length }
}

export async function getOfflineReportCount() {
  return (await getOfflineReports()).length
}

export { isNetworkError }
