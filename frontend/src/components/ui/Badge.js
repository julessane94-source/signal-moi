export default function Badge({ children, variant = 'primary', size = 'md' }) {
  const variants = {
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs font-medium',
    md: 'px-3 py-1 text-sm font-medium',
    lg: 'px-4 py-2 text-base font-medium',
  }

  return (
    <span className={`rounded-full inline-flex ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
