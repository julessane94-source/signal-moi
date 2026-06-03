import { motion } from 'framer-motion'

const statusConfig = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: '⏳ En attente' },
  progress: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: '🔄 En cours' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: '✅ Résolu' },
  rejected: { bg: 'bg-danger-100', text: 'text-danger-800', dot: 'bg-danger-500', label: '❌ Rejeté' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: '📦 Archivé' },
}

export default function StatusBadge({ status = 'pending', custom = null, animated = true }) {
  const config = custom || statusConfig[status] || statusConfig.pending

  const content = (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <motion.span
        animate={animated ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-2 h-2 rounded-full ${config.dot}`}
      />
      {custom?.label || config.label}
    </span>
  )

  return content
}
