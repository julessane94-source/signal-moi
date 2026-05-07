import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p>&copy; 2024 Signal-Moi. Tous droits reserves.</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Link href="/about" className="text-gray-400 hover:text-white">A propos</Link>
          <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
          <Link href="/privacy" className="text-gray-400 hover:text-white">Confidentialite</Link>
        </div>
      </div>
    </footer>
  )
}