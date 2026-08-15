import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon as XMark } from '@heroicons/react/24/outline'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
            <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`max-h-[92dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl ${sizes[size]}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
                  <h2 className="pr-3 text-lg font-semibold text-gray-900">{title}</h2>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
                      aria-label="Fermer"
                    >
                      <XMark className="h-6 w-6" />
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[calc(92dvh-5rem)] overflow-y-auto overscroll-contain p-4 sm:max-h-[calc(100dvh-8rem)] sm:p-6">{children}</div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
