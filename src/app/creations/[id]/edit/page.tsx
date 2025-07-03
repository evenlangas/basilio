'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import UserSearchInput from '@/components/UserSearchInput';
import CameraInput from '@/components/CameraInput';
import { IoArrowBack, IoCamera, IoClose, IoBook, IoTime, IoPeople } from 'react-icons/io5';

interface Recipe {
  _id: string;
  title: string;
  image?: string;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  recipe?: Recipe;
  recipeRating?: number;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

export default function EditCreationPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = use(params);
  
  const [creation, setCreation] = useState<Creation | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [recipe, setRecipe] = useState<string>('');
  const [eatenWith, setEatenWith] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [drankWith, setDrankWith] = useState('');
  const [chefName, setChefName] = useState('');
  const [recipeRating, setRecipeRating] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCreation();
    loadRecipes();
  }, [session, status, router, id]);

  const loadCreation = async () => {
    try {
      const response = await fetch(`/api/creations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCreation(data);
        
        // Check if user owns this creation
        if (data.createdBy._id !== session?.user?.id) {
          router.push(`/creations/${id}`);
          return;
        }
        
        // Populate form with current data
        setTitle(data.title || '');
        setDescription(data.description || '');
        setImagePreview(data.image || '');
        setRecipe(data.recipe?._id || '');
        setEatenWith(data.eatenWith || '');
        setCookingTime(data.cookingTime?.toString() || '');
        setDrankWith(data.drankWith || '');
        setChefName(data.chefName || '');
        setRecipeRating(data.recipeRating || 0);
      } else if (response.status === 404) {
        router.push('/creations');
      }
    } catch (error) {
      console.error('Error loading creation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = imagePreview;
      
      // Upload new image if provided
      if (image) {
        const formData = new FormData();
        formData.append('image', image);

        const uploadResponse = await fetch('/api/upload/creation-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }

      // Update the creation
      const updateResponse = await fetch(`/api/creations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image: imageUrl,
          recipe: recipe || null,
          eatenWith: eatenWith.trim(),
          cookingTime: cookingTime ? parseInt(cookingTime) : 0,
          drankWith: drankWith.trim(),
          chefName: chefName.trim(),
          recipeRating: recipeRating > 0 ? recipeRating : null,
        }),
      });

      if (updateResponse.ok) {
        router.push(`/creations/${id}`);
      } else {
        alert('Failed to update creation');
      }
    } catch (error) {
      console.error('Error updating creation:', error);
      alert('Failed to update creation');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <PageLoadingSkeleton />;
  }

  if (!session || !creation) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Edit Creation
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Photo (optional)
            </label>
            
            <CameraInput
              onImageCapture={(file) => {
                setImage(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setImagePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              }}
              onImageSelect={(file) => {
                setImage(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setImagePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              }}
              currentImage={imagePreview}
              onRemoveImage={() => {
                setImage(null);
                setImagePreview('');
              }}
            />
          </div>

          {/* Title */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you make?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your creation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Recipe Link */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <label htmlFor="recipe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link to Recipe
            </label>
            <select
              id="recipe"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a recipe (optional)</option>
              {recipes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Recipe Rating */}
          {recipe && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rate this recipe
              </label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const rating = i + 1;
                  const isSelected = rating <= recipeRating;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRecipeRating(rating === recipeRating ? 0 : rating)}
                      className={`text-2xl transition-all duration-200 hover:scale-110 ${
                        isSelected ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                      }`}
                      style={{
                        filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
                      }}
                    >
                      🤌
                    </button>
                  );
                })}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {recipeRating > 0 ? `${recipeRating} chef's ${recipeRating === 1 ? 'kiss' : 'kisses'}` : 'Click to rate'}
                </span>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Details</h3>
            
            <UserSearchInput
              value={eatenWith}
              onChange={setEatenWith}
              placeholder="Search users or type custom text..."
              label="🍽️ Who did you eat this with?"
              allowFreeText={true}
            />

            <div>
              <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <IoTime size={16} className="inline mr-1" />
                Cooking time (minutes)
              </label>
              <input
                type="number"
                id="cookingTime"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                placeholder="30"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <UserSearchInput
              value={drankWith}
              onChange={setDrankWith}
              placeholder="Search users or type custom text..."
              label="🥤 What did you drink with this?"
              allowFreeText={true}
            />

            <UserSearchInput
              value={chefName}
              onChange={setChefName}
              placeholder="Search users or type custom text..."
              label="👨‍🍳 Chef name (if someone else cooked)"
              allowFreeText={true}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Update Creation'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}