import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function DeposerPlainte() {
  const router = useRouter()
  const signalementId = router.query.signalement

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-14">
      <section className="mx-auto max-w-3xl px-4">
        <Head><title>Déposer plainte - Signal-Moi</title></Head>
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="bg-gradient-to-br from-slate-950 to-emerald-950 p-7 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Après votre signalement</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Envisagez de déposer plainte</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-200">Le signalement alerte les équipes et aide à localiser un incident. La plainte permet d’enregistrer officiellement les faits auprès des autorités compétentes.</p>
          </div>
          <div className="space-y-6 p-7 sm:p-10">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <h2 className="font-black">Pourquoi est-ce important ?</h2>
              <p className="mt-2 text-sm leading-6">En cas de vol, violence, menace, agression ou préjudice personnel, une plainte donne un cadre officiel aux vérifications et vous permet de conserver une référence de la démarche.</p>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Préparez-vous simplement</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Présentez-vous au commissariat ou à la gendarmerie compétente.</li>
                <li>• Apportez une pièce d’identité et les preuves disponibles.</li>
                <li>• Communiquez la référence Signal-Moi si vous en avez une.</li>
              </ul>
            </div>
            {signalementId ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Référence de signalement : {signalementId}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/citizen/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700">Retour à mon espace</Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-800 hover:bg-slate-50">Contacter Signal-Moi</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
