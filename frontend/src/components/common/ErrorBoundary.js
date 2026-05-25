import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
            <p className="text-gray-600 mb-4">Nous avons rencontré un problème en affichant cette page.</p>
            <a href="/" className="text-indigo-600 hover:underline">Retour à l'accueil</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
