import { motion } from 'framer-motion'

export default function Card({
  children,
  hover = true,
  rounded = 'xl',
  shadow = 'md',
  className = '',
  onClick = null,
  ...props
}) {
  const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  }

  const roundedSizes = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  }

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      className={`bg-white/95 backdrop-blur-sm border border-gray-200/80 ${roundedSizes[rounded]} ${shadows[shadow]} overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}
