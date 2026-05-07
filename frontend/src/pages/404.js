import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-2">404 — Page non trouvée</h1>
        <p className="text-gray-600 mb-4">La page que vous cherchez n'existe pas.</p>
        <Link href="/" className="text-indigo-600 hover:underline">Retour à l'accueil</Link>
      </div>
    </div>
  )
}
