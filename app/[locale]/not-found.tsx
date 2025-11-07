import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-deep-charcoal mb-4">404</h1>
        <p className="text-xl text-deep-charcoal/70 mb-8">Page not found</p>
        <Link
          href="/en"
          className="px-6 py-3 bg-saudi-green text-white rounded-full font-semibold hover:bg-saudi-green/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

