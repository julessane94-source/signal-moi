import Link from 'next/link';
import { HeartIcon as Heart } from '@heroicons/react/24/outline';

export default function DonateButton() {
  return (
    <Link href="/donate">
      <a className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
        <Heart className="w-5 h-5" />
        Faire un don
      </a>
    </Link>
  );
}
