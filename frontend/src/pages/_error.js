import Link from 'next/link'

export default function ErrorPage({ statusCode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold mb-2">Une erreur est survenue</h1>
        <p className="text-gray-600 mb-4">{statusCode ? `Code: ${statusCode}` : 'Erreur inconnue'}</p>
        <Link href="/" className="text-indigo-600 hover:underline">Retour à l'accueil</Link>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
