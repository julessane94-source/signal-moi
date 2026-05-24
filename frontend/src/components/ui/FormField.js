export default function FormField({
  label,
  error,
  required = false,
  helperText,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </div>
  )
}
