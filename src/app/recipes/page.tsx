'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  IoBulb, 
  IoCart, 
  IoBook, 
  IoRestaurant, 
  IoTime, 
  IoPeople 
} from 'react-icons/io5';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: { step: number; description: string }[];
  cookingTime: number;
  servings: number;
  url: string;
  image: string;
  tags: string[];
  createdBy: { _id: string; name: string };
  createdAt: string;
}

export default function RecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchRecipes();
  }, [session, status, router]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="empty-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
      <Navigation />
      
      <main className="container" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
        <div className="page-header">
          <div className="mb-4 sm:mb-0">
            <h1 className="page-title">
              {session.user.familyId ? 'Family Recipes' : 'My Recipes'}
            </h1>
            <p className="page-subtitle">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your{' '}
              {session.user.familyId ? 'family' : 'personal'} cookbook
            </p>
            {!session.user.familyId && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--color-secondary-600)', marginTop: 'var(--spacing-md)'}}>
<IoBulb className="inline mr-1" size={16} /> <Link href="/family" className="underline hover:text-blue-800">Join or create a family</Link> to share recipes with others!
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Link
              href="/shopping"
              className="btn btn-secondary"
            >
<IoCart className="mr-1" size={20} />
              <span>Shopping List</span>
            </Link>
            <Link
              href="/recipes/new"
              className="btn btn-primary"
            >
              Add Recipe
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{maxWidth: '384px'}}
          />
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
<div className="empty-state-icon">
              <IoBook size={48} />
            </div>
            <h3 className="empty-state-title">
              {searchTerm ? 'No recipes found' : 'No recipes yet'}
            </h3>
            <p className="empty-state-description">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start building your cookbook by adding your first recipe'
              }
            </p>
            {!searchTerm && (
              <Link
                href="/recipes/new"
                className="btn btn-primary btn-lg"
              >
                Add Your First Recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe._id}`}
                className="recipe-card card"
              >
                {recipe.image ? (
                  <div className="h-40 sm:h-48 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="recipe-image"
                    />
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 flex items-center justify-center" style={{backgroundColor: 'var(--color-bg-tertiary)'}}>
                    <div className="text-center" style={{color: 'var(--color-text-tertiary)'}}>
<div className="text-3xl sm:text-4xl mb-2">
                        <IoRestaurant size={40} />
                      </div>
                      <div className="text-xs sm:text-sm">No image</div>
                    </div>
                  </div>
                )}
                <div className="recipe-content">
                  <h3 className="recipe-title">
                    {recipe.title}
                  </h3>
                  
                  {recipe.description && (
                    <p className="recipe-description">
                      {recipe.description}
                    </p>
                  )}
                  
                  <div className="recipe-meta">
<span className="flex items-center">
                      <IoTime className="mr-1" size={16} />
                      {recipe.cookingTime || 0}m
                    </span>
                    <span className="flex items-center">
                      <IoPeople className="mr-1" size={16} />
                      {recipe.servings || 1}
                    </span>
                  </div>
                  
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {recipe.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="badge badge-success"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                          +{recipe.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                    <span className="truncate mr-2">
                      {recipe.createdBy.name}
                    </span>
                    {recipe.familyId && (
<span className="badge badge-secondary">
                        <IoPeople size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}