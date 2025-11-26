import { AxiosError } from 'axios';
import { toast } from './toast';

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiError;

    switch (status) {
      case 400:
        return data?.error || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return data?.error || 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data?.error || error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

export const handleApiErrorWithToast = (error: unknown, customMessage?: string) => {
  const errorMessage = customMessage || handleApiError(error);
  toast.error(errorMessage);
  return errorMessage;
};

