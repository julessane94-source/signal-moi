import { motion } from 'framer-motion'

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient = false,
  onClick,
  index = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, boxShadow: 'var(--tw-shadow-card-hover)' }}
      onClick={onClick}
      className={`relative group overflow-hidden rounded-2xl p-6 shadow-soft border transition-all cursor-pointer
        ${gradient 
          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent' 
          : 'bg-white/80 backdrop-blur-sm border-slate-200/50 text-slate-900'
        }
      `}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
        bg-gradient-to-r from-indigo-600/10 to-cyan-600/10" />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div 
          className={`text-3xl mb-4 w-fit p-3 rounded-xl ${
            gradient ? 'bg-white/20' : 'bg-indigo-100/60'
          }`}
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          {icon}
        </motion.div>

        {/* Title */}
        <h3 className={`text-lg font-semibold mb-2 ${
          gradient ? 'text-white' : 'text-slate-900'
        }`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-sm leading-relaxed ${
          gradient ? 'text-white/90' : 'text-slate-600'
        }`}>
          {description}
        </p>

        {/* Arrow hint */}
        <motion.div 
          className={`mt-4 flex items-center gap-2 text-sm font-medium ${
            gradient ? 'text-white/80' : 'text-indigo-600'
          }`}
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
        >
          <span>En savoir plus</span>
          <span>→</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
