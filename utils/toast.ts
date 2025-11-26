import { showToast } from 'nextjs-toast-notify';

interface ToastOptions {
  duration?: number;
  progress?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  transition?: 'topBounce' | 'bottomBounce' | 'fade' | 'slide';
  icon?: string;
  sound?: boolean;
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  progress: true,
  position: 'bottom-center',
  transition: 'topBounce',
  icon: '',
  sound: true,
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    showToast.success(message, { ...defaultOptions, ...options });
  },
  error: (message: string, options?: ToastOptions) => {
    showToast.error(message, { ...defaultOptions, ...options });
  },
  warning: (message: string, options?: ToastOptions) => {
    showToast.warning(message, { ...defaultOptions, ...options });
  },
  info: (message: string, options?: ToastOptions) => {
    showToast.info(message, { ...defaultOptions, ...options });
  },
};

