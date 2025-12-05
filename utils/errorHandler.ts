import { AxiosError } from 'axios';
import { toast } from './toast';

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export const handleApiError = (error: unknown): string => {
  // Helper function to extract error message from data
  const extractErrorMessage = (data: any): string | null => {
    if (!data || typeof data !== 'object') return null;
    
    // Check for error field (most common)
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
    
    // Check for message field
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    
    // Check for detail field (Django REST framework style)
    if (data.detail && typeof data.detail === 'string') {
      return data.detail;
    }
    
    return null;
  };

  // Handle RTK Query errors (from .unwrap())
  // RTK Query errors can have structure: { data: {...}, status: number } or { error: { data: {...}, status: number } }
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // First, try to extract error message directly from the error object (in case data is at top level)
    const directErrorMessage = extractErrorMessage(errorObj);
    if (directErrorMessage) {
      return directErrorMessage;
    }
    
    // Check for RTK Query error structure: error.data and error.status
    if ('data' in errorObj || 'status' in errorObj) {
      const data = errorObj.data as ApiError;
      const status = errorObj.status;
      
      // Try to extract error message from data
      const errorMessage = extractErrorMessage(data);
      if (errorMessage) {
        return errorMessage;
      }
      
      // Handle by status code if no specific error message
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Session expired. Please login again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
    
    // Check for nested error structure: error.error.data and error.error.status
    if (errorObj.error && typeof errorObj.error === 'object') {
      const nestedError = errorObj.error;
      
      // Try to extract error message directly from nested error
      const nestedDirectMessage = extractErrorMessage(nestedError);
      if (nestedDirectMessage) {
        return nestedDirectMessage;
      }
      
      const data = nestedError.data as ApiError;
      const status = nestedError.status;
      
      // Try to extract error message from data
      const errorMessage = extractErrorMessage(data);
      if (errorMessage) {
        return errorMessage;
      }
      
      // Handle by status code if no specific error message
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Session expired. Please login again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
  }

  // Handle AxiosError
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiError;
    
    // Try to extract error message from data
    const errorMessage = extractErrorMessage(data);
    if (errorMessage) {
      return errorMessage;
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  // Handle standard Error objects
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

