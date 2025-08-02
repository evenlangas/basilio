'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import UserSearchInput from '@/components/UserSearchInput';
import MultiUserSearchInput from '@/components/MultiUserSearchInput';
import RecipeSearchInput from '@/components/RecipeSearchInput';
import CameraInput from '@/components/CameraInput';
import { IoArrowBack, IoCamera, IoClose, IoBook, IoTime, IoPeople, IoRestaurantOutline } from 'react-icons/io5';


export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [recipes, setRecipes] = useState<Array<{recipe: string, rating: number | null}>>([]);
  // Legacy fields for backward compatibility
  const [eatenWith, setEatenWith] = useState('');
  const [chefName, setChefName] = useState('');
  // New user ID fields
  const [eatenWithUsers, setEatenWithUsers] = useState<Array<{_id: string, name: string, image?: string}>>([]);
  const [chef, setChef] = useState<{_id: string, name: string, image?: string} | null>(null);
  const [cookingTime, setCookingTime] = useState('');
  const [drankWith, setDrankWith] = useState('');
  const [loading, setLoading] = useState(false);
  // Mode toggle for testing both approaches
  const [useNewUserIds, setUseNewUserIds] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const addRecipe = () => {
    setRecipes([...recipes, { recipe: '', rating: null }]);
  };

  const removeRecipe = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

  const updateRecipe = (index: number, recipeId: string) => {
    const newRecipes = [...recipes];
    newRecipes[index].recipe = recipeId;
    setRecipes(newRecipes);
  };

  const updateRecipeRating = (index: number, rating: number | null) => {
    const newRecipes = [...recipes];
    newRecipes[index].rating = rating;
    setRecipes(newRecipes);
  };

  const renderPinchedFingers = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = i < rating;
      return (
        <span 
          key={i} 
          className={`inline-block transition-all cursor-pointer ${
            isSelected ? 'opacity-100' : 'opacity-30'
          }`}
          style={{
            filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
          }}
        >
          🤌
        </span>
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      
      // Upload image if provided
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

      // Create the creation
      const creationResponse = await fetch('/api/creations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image: imageUrl,
          recipes: recipes.filter(r => r.recipe), // Only include recipes that have been selected
          // Send both legacy and new fields for backward compatibility
          eatenWith: useNewUserIds ? '' : eatenWith.trim(),
          chefName: useNewUserIds ? '' : chefName.trim(),
          eatenWithUsers: useNewUserIds ? eatenWithUsers.map(u => u._id) : [],
          chef: useNewUserIds ? chef?._id : null,
          cookingTime: cookingTime ? parseInt(cookingTime) : 0,
          drankWith: drankWith.trim(),
        }),
      });

      if (creationResponse.ok) {
        router.push('/');
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

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
            Share Your Creation
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

          {/* Recipes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <IoBook size={16} className="inline mr-1" />
                Recipes Used
              </label>
              <button
                type="button"
                onClick={addRecipe}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                + Add Recipe
              </button>
            </div>

            {recipes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recipes added yet. Click "Add Recipe" to link a recipe to this creation.
              </p>
            )}

            {recipes.map((recipeItem, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 last:mb-0">
                <div className="flex items-start gap-3">
                  <IoRestaurantOutline size={16} className="text-gray-500 dark:text-gray-400 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <RecipeSearchInput
                      value={recipeItem.recipe}
                      onChange={(recipeId) => updateRecipe(index, recipeId)}
                      label=""
                      placeholder="Search for a recipe..."
                    />
                    
                    {recipeItem.recipe && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rate this recipe
                        </label>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const rating = i + 1;
                            const isSelected = rating <= (recipeItem.rating || 0);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => updateRecipeRating(index, rating === recipeItem.rating ? null : rating)}
                                className={`text-xl transition-all duration-200 hover:scale-110 ${
                                  isSelected 
                                    ? 'filter-none' 
                                    : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-0'
                                }`}
                                style={{
                                  filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
                                }}
                              >
                                🤌
                              </button>
                            );
                          })}
                          {recipeItem.rating && (
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {recipeItem.rating.toFixed(1)} 🤌
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipe(index)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                  >
                    <IoClose size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Details</h3>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={useNewUserIds}
                  onChange={(e) => setUseNewUserIds(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Use New User ID System
              </label>
            </div>
            
            <UserSearchInput
              value={eatenWith}
              onChange={setEatenWith}
              placeholder="Search users or type custom text..."
              label="👥 Who did you eat this with?"
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

            <div>
              <label htmlFor="drankWith" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🥤 What did you drink with this?
              </label>
              <input
                type="text"
                id="drankWith"
                value={drankWith}
                onChange={(e) => setDrankWith(e.target.value)}
                placeholder="Wine, beer, water, coffee..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {useNewUserIds ? (
              <UserSearchInput
                value={chef?.name || ''}
                onChange={() => {}} // Not used in new mode
                onUserSelect={setChef}
                placeholder="Search for the chef..."
                label="👨‍🍳 Chef name (if someone else cooked)"
                allowFreeText={false}
                mode="userIds"
              />
            ) : (
              <UserSearchInput
                value={chefName}
                onChange={setChefName}
                placeholder="Search users or type custom text..."
                label="👨‍🍳 Chef name (if someone else cooked) - Legacy Mode"
                allowFreeText={true}
                mode="legacy"
              />
            )}
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
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Share Creation'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}