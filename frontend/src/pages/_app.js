import { useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '../context/AuthContext'
import { SocketProvider } from '../context/SocketContext'
import { ToastContainer } from 'react-toastify'
import { useRouter } from 'next/router'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import Head from 'next/head'
import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  
  // Pages sans Navbar et Footer
  const noLayoutPages = ['/login', '/register', '/404']
  // Pages dashboard sans Footer
  const dashboardPages = ['/admin/dashboard', '/citizen/dashboard', '/police/dashboard', '/collaborator/dashboard']
  
  const hideNavbar = noLayoutPages.includes(router.pathname)
  const hideFooter = noLayoutPages.includes(router.pathname) || dashboardPages.includes(router.pathname)

  useEffect(() => {
    document.documentElement.lang = 'fr'
  }, [])

  return (
    <HelmetProvider>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Plateforme de signalement citoyen" />
      </Head>
      <AuthProvider>
        <SocketProvider>
          {!hideNavbar && <Navbar />}
          <Component {...pageProps} />
          {!hideFooter && <Footer />}
          <ToastContainer position="bottom-right" autoClose={5000} />
        </SocketProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default MyApp