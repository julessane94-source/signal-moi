import { motion } from 'framer-motion'
import Card from './Card'

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick = null,
}) {
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-400 mb-2">📭</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </div>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
