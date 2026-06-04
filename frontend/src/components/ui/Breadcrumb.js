import Link from 'next/link'
import { ChevronRightIcon as ChevronRight } from '@heroicons/react/24/outline'

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 px-4 py-3 bg-gradient-1 rounded-lg w-fit">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href}>
              <span className="text-indigo-600 hover:text-indigo-700 font-medium transition">{item.label}</span>
            </Link>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
          {idx < items.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      ))}
    </nav>
  )
}
