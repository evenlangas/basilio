'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, show, onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="text-lg">{icons[type]}</span>
      <span style={{fontWeight: 'var(--font-medium)'}}>{message}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          color: 'white',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'var(--font-bold)',
          fontSize: 'var(--text-lg)',
          padding: '0',
          lineHeight: '1'
        }}
      >
        ×
      </button>
    </div>
  );
}