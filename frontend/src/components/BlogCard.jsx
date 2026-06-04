import Link from 'next/link'

export default function BlogCard({ icon, title, excerpt, date, author, href }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm border">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{excerpt}</p>
      <div className="mt-4 text-xs text-gray-500">{date} — {author}</div>
      <div className="mt-4">
        <Link href={href}>
          <a className="text-indigo-600 font-medium">Lire l'article →</a>
        </Link>
      </div>
    </article>
  )
}
