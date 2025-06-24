'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="recipe-card card">
      {/* Image skeleton */}
      <div className="h-40 sm:h-48 skeleton" />
      
      {/* Content skeleton */}
      <div className="recipe-content">
        {/* Title */}
        <Skeleton className="h-6 mb-3" width="80%" />
        
        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4" width="100%" />
          <Skeleton className="h-4" width="75%" />
        </div>
        
        {/* Meta info */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-4" width="60px" />
          <Skeleton className="h-4" width="60px" />
        </div>
        
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 rounded-full" width="60px" />
          <Skeleton className="h-6 rounded-full" width="80px" />
        </div>
        
        {/* Author */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4" width="100px" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div className="card">
      {/* Image skeleton */}
      <div className="h-64 md:h-80 skeleton" />
      
      <div className="card-body">
        {/* Header */}
        <div className="mb-6">
          <Skeleton className="h-8 mb-4" width="70%" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-5" width="80px" />
            <Skeleton className="h-5" width="80px" />
            <Skeleton className="h-5" width="100px" />
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <Skeleton className="h-6 mb-3" width="120px" />
          <div className="space-y-2">
            <Skeleton className="h-4" width="100%" />
            <Skeleton className="h-4" width="85%" />
          </div>
        </div>
        
        {/* Ingredients */}
        <div className="mb-6">
          <Skeleton className="h-6 mb-4" width="140px" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Instructions */}
        <div>
          <Skeleton className="h-6 mb-4" width="140px" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 mb-2" width="100%" />
                  <Skeleton className="h-4" width="60%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShoppingListSkeleton() {
  return (
    <div className="card card-body">
      {/* Add item section */}
      <div className="mb-6">
        <Skeleton className="h-6 mb-4" width="120px" />
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-20" />
          <Skeleton className="h-10 w-full sm:w-16" />
        </div>
      </div>
      
      {/* Items list */}
      <div>
        <Skeleton className="h-6 mb-4" width="100px" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 mb-1" width="70%" />
                  <Skeleton className="h-3" width="40%" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="card card-body space-y-6">
      {/* Title and URL */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-group">
          <Skeleton className="h-5 mb-2" width="100px" />
          <Skeleton className="h-10" />
        </div>
        <div className="form-group">
          <Skeleton className="h-5 mb-2" width="120px" />
          <Skeleton className="h-10" />
        </div>
      </div>
      
      {/* Description */}
      <div className="form-group">
        <Skeleton className="h-5 mb-2" width="90px" />
        <Skeleton className="h-24" />
      </div>
      
      {/* Image upload */}
      <div className="form-group">
        <Skeleton className="h-5 mb-2" width="140px" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      
      {/* Cooking details */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="form-group">
          <Skeleton className="h-5 mb-2" width="100px" />
          <Skeleton className="h-10" />
        </div>
        <div className="form-group">
          <Skeleton className="h-5 mb-2" width="80px" />
          <Skeleton className="h-10" />
        </div>
        <div className="form-group">
          <Skeleton className="h-5 mb-2" width="60px" />
          <Skeleton className="h-10" />
        </div>
      </div>
      
      {/* Ingredients */}
      <div>
        <Skeleton className="h-5 mb-4" width="100px" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:border-0 sm:p-0">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1 sm:flex-none sm:w-24" />
                <Skeleton className="h-10 flex-1 sm:flex-none sm:w-20" />
              </div>
              <Skeleton className="h-10 w-10" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Instructions */}
      <div>
        <Skeleton className="h-5 mb-4" width="100px" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-10 w-16 flex-shrink-0" />
              <Skeleton className="h-24 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex gap-3">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-24" />
      </div>
    </div>
  );
}

export function FamilyPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="h-8 mb-4 mx-auto" width="200px" />
        <Skeleton className="h-5 mx-auto" width="300px" />
      </div>
      
      {/* Family info card */}
      <div className="card card-body">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Skeleton className="h-6 mb-2" width="150px" />
            <Skeleton className="h-4" width="100px" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        
        <div className="space-y-4">
          <div>
            <Skeleton className="h-5 mb-2" width="80px" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          
          <div>
            <Skeleton className="h-5 mb-3" width="100px" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded">
                  <Skeleton className="h-4" width="120px" />
                  <Skeleton className="h-4" width="80px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
      {/* Navigation skeleton (just top bar for mobile/desktop) */}
      <div className="nav">
        <div className="nav-container">
          <div className="flex justify-between items-center h-16">
            <Skeleton className="h-8" width="120px" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <main className="container" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
        <div className="page-header">
          <Skeleton className="h-10 mb-4 mx-auto" width="300px" />
          <Skeleton className="h-6 mx-auto" width="400px" />
        </div>
        
        {/* Content placeholder */}
        <div className="space-y-6">
          <Skeleton className="h-12" width="100%" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}