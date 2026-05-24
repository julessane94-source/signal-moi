import { forwardRef } from 'react'

const Input = forwardRef(({
  type = 'text',
  placeholder,
  error = false,
  size = 'md',
  icon: Icon = null,
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }

  const inputStyles = error
    ? 'border-red-500'
    : 'border-gray-300'

  return (
    <div className="relative">
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`
          w-full
          border rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${sizes[size]}
          ${inputStyles}
          ${Icon ? 'pl-10' : ''}
          ${className}
        `}
        {...props}
      />
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
