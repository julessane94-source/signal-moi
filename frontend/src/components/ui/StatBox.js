import { motion } from 'framer-motion'

export default function StatBox({ 
  title, 
  value, 
  icon: Icon = null, 
  change = null, 
  trend = 'up',
  color = 'indigo' 
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-md p-6 overflow-hidden relative"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 ${colors[color]} rounded-full opacity-10 -mr-10 -mt-10`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
          {Icon && (
            <div className={`p-2 rounded-lg ${colors[color]} bg-opacity-10`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
