import { toast } from 'react-hot-toast';

// Simple hook to provide toast interface
export const useToast = () => {
  return {
    toast: {
      title: (title: string) => {
        toast(title);
      },
      success: (message: string, options?: any) => {
        toast.success(message, options);
      },
      error: (message: string, options?: any) => {
        toast.error(message, options);
      },
      warning: (message: string, options?: any) => {
        toast(message, { 
          icon: '⚠️',
          ...options 
        });
      },
      info: (message: string, options?: any) => {
        toast(message, { 
          icon: 'ℹ️',
          ...options 
        });
      },
      // Support for object params
      // Used by the FileContext
      custom: (params: { title?: string, description: string, variant?: string }) => {
        const { title, description, variant } = params;
        if (variant === 'destructive') {
          toast.error(description);
        } else {
          toast.success(description);
        }
      }
    }
  };
}; 