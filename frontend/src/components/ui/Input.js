import { forwardRef } from 'react'

const Input = forwardRef(({
  type = 'text',
  placeholder,
  error = false,
  size = 'md',
  icon: Icon = null,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg',
  }

  const inputStyles = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-200 focus:ring-indigo-500'

  return (
    <div className="relative">
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full
          bg-white
          border rounded-2xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:border-transparent
          placeholder-gray-400
          ${sizes[size]}
          ${inputStyles}
          ${Icon ? 'pl-12' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {Icon && (
        <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
