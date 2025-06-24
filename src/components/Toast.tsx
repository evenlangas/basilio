'use client';

import { useEffect, useState } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle } from 'react-icons/io5';

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
    success: <IoCheckmarkCircle size={20} />,
    error: <IoCloseCircle size={20} />,
    info: <IoInformationCircle size={20} />,
  };

  return (
    <div className={`toast toast-${type}`}>
      {icons[type]}
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