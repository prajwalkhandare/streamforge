import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-darker rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-auto z-10">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;