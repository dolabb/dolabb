'use client';

import { HiXMark } from 'react-icons/hi2';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-rich-sand/30'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-bold text-deep-charcoal'>{title}</h3>
            <button
              onClick={onClose}
              className='text-deep-charcoal/60 hover:text-deep-charcoal transition-colors'
              disabled={isLoading}
            >
              <HiXMark className='w-6 h-6' />
            </button>
          </div>
          <p className='text-deep-charcoal/80 mb-6'>{message}</p>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 px-4 py-2 border-2 border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 hover:border-rich-sand/50 transition-all cursor-pointer disabled:opacity-50'
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Deleting...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

