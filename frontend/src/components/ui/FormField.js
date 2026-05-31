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
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {helperText && <p className="text-sm text-slate-500 mt-2">{helperText}</p>}
    </div>
  )
}
