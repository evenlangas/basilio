'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { IoLeaf, IoBook, IoCart, IoHardwareChip, IoPeople } from 'react-icons/io5';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    } else {
      router.push('/recipes');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
              Welcome to Basilio <IoLeaf size={40} color="var(--color-primary-600)" />
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your simple and intuitive digital cookbook. Organize recipes, manage shopping lists, 
            and get AI-powered cooking suggestions with your family.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/recipes"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              <IoBook size={48} color="var(--color-primary-600)" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Recipes</h2>
            <p className="text-gray-600">
              Store and organize all your favorite recipes in one place
            </p>
          </Link>

          <Link
            href="/shopping"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              <IoCart size={48} color="var(--color-primary-600)" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Shopping List</h2>
            <p className="text-gray-600">
              Keep track of ingredients and items you need to buy
            </p>
          </Link>

          <Link
            href="/ai-helper"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              <IoHardwareChip size={48} color="var(--color-primary-600)" />
            </div>
            <h2 className="text-xl font-semibold mb-2">AI Helper</h2>
            <p className="text-gray-600">
              Get recipe suggestions based on ingredients you have
            </p>
          </Link>

          <Link
            href="/family"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              <IoPeople size={48} color="var(--color-primary-600)" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Family</h2>
            <p className="text-gray-600">
              Share your cookbook and shopping lists with family members
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
