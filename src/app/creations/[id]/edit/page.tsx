'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import UserSearchInput from '@/components/UserSearchInput';
import LockedUserInput from '@/components/LockedUserInput';
import LockedMultiUserInput from '@/components/LockedMultiUserInput';
import FlexibleMultiInput from '@/components/FlexibleMultiInput';
import RecipeSearchInput from '@/components/RecipeSearchInput';
import CameraInput from '@/components/CameraInput';
import { IoArrowBack, IoCamera, IoClose, IoBook, IoTime, IoPeople, IoRestaurantOutline } from 'react-icons/io5';

interface FlexibleEntry {
  id: string;
  type: 'user' | 'custom';
  name: string;
  user?: {_id: string, name: string, image?: string}; // Only present if type is 'user'
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  recipes?: Array<{
    recipe: Recipe;
    rating?: number;
  }>;
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
  const [recipes, setRecipes] = useState<Array<{recipe: string, rating: number | null}>>([]);
  const [eatenWithEntries, setEatenWithEntries] = useState<FlexibleEntry[]>([]);
  const [chefEntries, setChefEntries] = useState<FlexibleEntry[]>([]);
  const [cookingTime, setCookingTime] = useState('');
  const [drankWith, setDrankWith] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCreation();
  }, [session, status, router, id]);

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
        setCookingTime(data.cookingTime?.toString() || '');
        setDrankWith(data.drankWith || '');
        
        // Convert legacy data to flexible entries
        const eatenWithEntries: FlexibleEntry[] = [];
        const chefEntries: FlexibleEntry[] = [];
        
        // Handle eaten with - prioritize new flexible entries, then user data, then legacy text
        if (data.eatenWithEntries && data.eatenWithEntries.length > 0) {
          // Use the new flexible entries format
          data.eatenWithEntries.forEach((entry: any) => {
            eatenWithEntries.push({
              id: entry.id,
              type: entry.type,
              name: entry.name,
              user: entry.user || undefined
            });
          });
        } else if (data.eatenWithUsers && data.eatenWithUsers.length > 0) {
          // Fallback to legacy user array field
          data.eatenWithUsers.forEach((user: any, index: number) => {
            eatenWithEntries.push({
              id: `user_${user._id}`,
              type: 'user',
              name: user.name,
              user: user
            });
          });
        } else if (data.eatenWith && data.eatenWith.trim()) {
          // Fallback to legacy text field
          const customNames = data.eatenWith.split(',').map(name => name.trim()).filter(name => name);
          customNames.forEach((name, index) => {
            eatenWithEntries.push({
              id: `custom_eaten_${index}_${Date.now()}`,
              type: 'custom',
              name: name
            });
          });
        }
        
        // Handle chef - prioritize new flexible entries, then user data, then legacy text
        if (data.chefEntries && data.chefEntries.length > 0) {
          // Use the new flexible entries format
          data.chefEntries.forEach((entry: any) => {
            chefEntries.push({
              id: entry.id,
              type: entry.type,
              name: entry.name,
              user: entry.user || undefined
            });
          });
        } else if (data.chef) {
          // Fallback to legacy single chef field
          chefEntries.push({
            id: `user_${data.chef._id}`,
            type: 'user',
            name: data.chef.name,
            user: data.chef
          });
        } else if (data.chefName && data.chefName.trim()) {
          // Fallback to legacy text field
          const customNames = data.chefName.split(',').map(name => name.trim()).filter(name => name);
          customNames.forEach((name, index) => {
            chefEntries.push({
              id: `custom_chef_${index}_${Date.now()}`,
              type: 'custom',
              name: name
            });
          });
        }
        
        setEatenWithEntries(eatenWithEntries);
        setChefEntries(chefEntries);
        
        // Handle recipes - support both old and new formats
        if (data.recipes && data.recipes.length > 0) {
          // New format: multiple recipes
          setRecipes(data.recipes.map(r => ({
            recipe: r.recipe._id,
            rating: r.rating || null
          })));
        } else if (data.recipe) {
          // Old format: single recipe
          setRecipes([{
            recipe: data.recipe._id,
            rating: data.recipeRating || null
          }]);
        } else {
          setRecipes([]);
        }
      } else if (response.status === 404) {
        router.push('/creations');
      }
    } catch (error) {
      console.error('Error loading creation:', error);
    } finally {
      setLoading(false);
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
          recipes: recipes.filter(r => r.recipe), // Only include recipes that have been selected
          // Send flexible entry data
          eatenWith: eatenWithEntries.filter(e => e.type === 'custom').map(e => e.name).join(', '),
          chefName: chefEntries.filter(e => e.type === 'custom').map(e => e.name).join(', '),
          eatenWithUsers: eatenWithEntries.filter(e => e.type === 'user' && e.user).map(e => e.user!._id),
          chef: chefEntries.find(e => e.type === 'user' && e.user)?._id || null,
          chefEntries: chefEntries, // Send all chef entries (both users and custom)
          eatenWithEntries: eatenWithEntries, // Send all eaten with entries (both users and custom)
          cookingTime: cookingTime ? parseInt(cookingTime) : 0,
          drankWith: drankWith.trim(),
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Details</h3>
            
            <FlexibleMultiInput
              selectedEntries={eatenWithEntries}
              onEntriesChange={setEatenWithEntries}
              placeholder="Search users or add custom names..."
              label="👥 Who did you eat this with?"
              maxEntries={10}
              allowCustomText={true}
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

            <FlexibleMultiInput
              selectedEntries={chefEntries}
              onEntriesChange={setChefEntries}
              placeholder="Search users or add co-chef names..."
              label="👨‍🍳 Who did you cook this with? (co-chefs)"
              maxEntries={5}
              allowCustomText={true}
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