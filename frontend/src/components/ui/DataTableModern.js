import { motion } from 'framer-motion'
import { ChevronsUpDown, Check } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function DataTableModern({ 
  columns = [], 
  data = [], 
  onSort, 
  sortBy,
  loading = false,
  emptyText = 'Aucune donnée'
}) {
  const [selectedRows, setSelectedRows] = useState(new Set())

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)))
    }
  }

  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-slate-200">
        <p className="text-slate-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-1 border-b border-slate-200">
            <th className="px-4 py-4 text-left">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="rounded cursor-pointer"
              />
            </th>
            {columns.map((col) => (
              <th 
                key={col.key}
                className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                onClick={() => onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {onSort && <ChevronsUpDown className="w-4 h-4 opacity-50" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <motion.tr 
              key={idx}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.has(idx)}
                  onChange={() => handleSelectRow(idx)}
                  className="rounded cursor-pointer"
                />
              </td>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-4 text-sm text-slate-600">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
