'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { FormSkeleton } from '@/components/SkeletonLoader';
import { IoCamera } from 'react-icons/io5';

interface Cookbook {
  _id: string;
  name: string;
  description: string;
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

export default function NewRecipePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Load cookbooks on component mount
  useEffect(() => {
    if (session) {
      loadCookbooks();
    }
  }, [session]);
  
  const loadCookbooks = async () => {
    try {
      const response = await fetch('/api/cookbooks');
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [cookingTime, setCookingTime] = useState(0);
  const [servings, setServings] = useState(1);
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [instructions, setInstructions] = useState<Instruction[]>([{ step: 1, description: '' }]);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selectedCookbook, setSelectedCookbook] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (image) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', image);
        
        const uploadResponse = await fetch('/api/upload/recipe-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          throw new Error('Failed to upload image');
        }
        setUploadingImage(false);
      }

      const recipeData = {
        title,
        description,
        url,
        image: imageUrl,
        cookingTime,
        servings,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        ingredients: ingredients.filter(ing => ing.name.trim()),
        instructions: instructions.filter(inst => inst.description.trim()),
        cookbook: selectedCookbook || undefined,
      };

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (response.ok) {
        if (selectedCookbook) {
          router.push(`/cookbooks/${selectedCookbook}`);
        } else {
          router.push('/recipes');
        }
      } else {
        console.error('Failed to create recipe');
        alert('Failed to create recipe. Please try again.');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      if (error instanceof Error && error.message === 'Failed to upload image') {
        alert('Failed to upload image. Please try again with a different image.');
      } else {
        alert('An error occurred while creating the recipe. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    );
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([...instructions, { step: instructions.length + 1, description: '' }]);
  };

  const updateInstruction = (index: number, description: string) => {
    const updated = instructions.map((inst, i) =>
      i === index ? { ...inst, description } : inst
    );
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions
      .filter((_, i) => i !== index)
      .map((inst, i) => ({ ...inst, step: i + 1 }));
    setInstructions(updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      setImage(file);
      
      // Create preview
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

  if (!session) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
        <Navigation />
        
        <main className="container container-sm" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
          <div className="page-header">
            <div className="skeleton h-10 mb-4 mx-auto" style={{width: '200px'}} />
            <div className="skeleton h-6 mx-auto" style={{width: '300px'}} />
          </div>
          
          <FormSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
      <Navigation />
      
      <main className="container container-sm" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
        <div className="page-header">
          <h1 className="page-title">Add New Recipe</h1>
          <p className="page-subtitle">Share your favorite recipe with your family</p>
        </div>
        
        <form onSubmit={handleSubmit} className="card card-body" style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)'}}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">
                Recipe Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="e.g., Grandma's Chocolate Chip Cookies"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Recipe URL (optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="form-input"
                placeholder="https://example.com/recipe"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="form-input form-textarea"
              placeholder="Brief description of the recipe..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Add to Cookbook (optional)
            </label>
            <select
              value={selectedCookbook}
              onChange={(e) => setSelectedCookbook(e.target.value)}
              className="form-input"
            >
              <option value="">Select a cookbook...</option>
              {cookbooks.map((cookbook) => (
                <option key={cookbook._id} value={cookbook._id}>
                  {cookbook.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Recipe Image (optional)
            </label>
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-4xl mb-2">
                      <IoCamera size={40} style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                    <div style={{fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)'}}>
                      Click to upload an image
                    </div>
                    <div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)'}}>
                      PNG, JPG, GIF up to 5MB
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cooking Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={cookingTime}
                onChange={(e) => setCookingTime(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="dessert, quick, vegetarian"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                + Add Ingredient
              </button>
            </div>
            
            <div className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex gap-3 sm:contents">
                    <div className="flex-1 sm:flex-none sm:w-24">
                      <input
                        type="text"
                        placeholder="Amount"
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="flex-1 sm:flex-none sm:w-20">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-600 hover:text-red-700 px-2 py-2 sm:px-2 sm:py-0 flex items-center justify-center min-w-[40px] sm:min-w-0"
                        aria-label="Remove ingredient"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Instructions</h3>
              <button
                type="button"
                onClick={addInstruction}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                + Add Step
              </button>
            </div>
            
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {instruction.step}
                  </div>
                  <textarea
                    placeholder="Describe this step..."
                    value={instruction.description}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage || !title.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {uploadingImage ? 'Uploading image...' : loading ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}