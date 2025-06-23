'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Check for saved theme in localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Fall back to system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    console.log('Applying theme:', newTheme);
    
    // Update localStorage
    localStorage.setItem('theme', newTheme);
    
    // Update document class
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added dark class. Current classes:', document.documentElement.className);
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class. Current classes:', document.documentElement.className);
    }
    
    // Force a style recalculation
    document.documentElement.style.colorScheme = newTheme;
  };

  const toggleTheme = () => {
    console.log('Toggle theme clicked. Mounted:', mounted, 'Current theme:', theme);
    if (!mounted) {
      console.log('Not mounted yet, ignoring toggle');
      return;
    }
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggling from', theme, 'to', newTheme);
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch by rendering a fallback until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}