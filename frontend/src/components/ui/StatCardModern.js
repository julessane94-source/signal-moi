import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export default function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'up',
  gradient = false,
  loading = false 
}) {
  const isPositive = trend === 'up'

  if (loading) {
    return (
      <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-shimmer" />
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: 'var(--tw-shadow-card-hover)' }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-soft border border-slate-200/50 transition-all ${
        gradient 
          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' 
          : 'bg-white/80 backdrop-blur-sm text-slate-900'
      }`}
    >
      <div className="absolute -right-8 -top-8 opacity-10">
        {Icon && <Icon className="w-32 h-32" />}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-medium uppercase tracking-wide ${
            gradient ? 'text-white/80' : 'text-slate-600'
          }`}>
            {title}
          </h3>
          {Icon && (
            <div className={`p-2 rounded-lg ${
              gradient 
                ? 'bg-white/20' 
                : 'bg-indigo-100'
            }`}>
              <Icon className={`w-5 h-5 ${gradient ? 'text-white' : 'text-indigo-600'}`} />
            </div>
          )}
        </div>

        <div>
          <p className={`text-3xl font-bold ${gradient ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${
              isPositive 
                ? gradient 
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-green-100 text-green-700'
                : gradient 
                  ? 'bg-red-500/20 text-red-100' 
                  : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className={`text-xs ${gradient ? 'text-white/70' : 'text-slate-500'}`}>
              vs. last month
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
