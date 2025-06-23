import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🌿</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl text-gray-600 mb-6">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or doesn't exist.
        </p>
        <Link
          href="/"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}