import { useEffect, useState } from 'react'
import { API_BASE } from '../../config/api'

const getProofEndpoint = (file) => {
  if (file?.id) return `${API_BASE}/api/signalements/fichiers/${file.id}`
  const value = String(file?.url || file?.chemin || '')
  if (value.startsWith('http')) return value
  return value.startsWith('/') ? `${API_BASE}${value}` : `${API_BASE}/${value}`
}

// Une balise <img>, <video> ou <audio> ne peut pas ajouter le Bearer token.
// Ce composant telecharge donc la preuve avec l'autorisation de la session et
// presente ensuite un URL temporaire, non partageable, au navigateur.
export default function AuthenticatedProof({ file, compact = false }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)
  const name = file?.nom_fichier || file?.nomFichier || 'Preuve jointe'
  const mimeType = file?.mime_type || file?.mimeType || file?.type || ''
  const isImage = mimeType.startsWith('image/')
  const isVideo = mimeType.startsWith('video/')
  const isAudio = mimeType.startsWith('audio/')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const token = localStorage.getItem('token')
    if (!token) { setError(true); return undefined }
    fetch(getProofEndpoint(file), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preuve inaccessible (${response.status})`)
        return response.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (active) setUrl(objectUrl)
      })
      .catch(() => { if (active) setError(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [file?.id, file?.url, file?.chemin])

  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Preuve indisponible ou accès refusé.</div>
  if (!url) return <div className="flex h-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">Chargement sécurisé…</div>

  return <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${compact ? '' : 'shadow-sm'}`}>
    {isImage ? <img src={url} alt={name} className="h-32 w-full object-cover" /> : null}
    {isVideo ? <video src={url} controls preload="metadata" className="h-32 w-full bg-black object-contain" /> : null}
    {isAudio ? <div className="flex h-32 items-center p-3"><audio src={url} controls className="w-full" /></div> : null}
    {!isImage && !isVideo && !isAudio ? <div className="flex h-28 items-center justify-center p-3 text-center text-xs font-bold text-slate-600">Document sécurisé</div> : null}
    <a href={url} download={name} className="block truncate border-t border-slate-100 px-2 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50" title={name}>Télécharger · {name}</a>
  </div>
}
