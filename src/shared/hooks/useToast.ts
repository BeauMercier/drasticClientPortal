import { useToast as useToastUI } from "@/components/ui/use-toast";
import { toast as hotToast } from 'react-hot-toast';

// Enhanced useToast hook that combines the UI toast with react-hot-toast functionality
export const useToast = () => {
  const uiToast = useToastUI();
  
  return {
    ...uiToast,
    toast: {
      ...uiToast.toast,
      // Add custom method needed by FileContext
      custom: (params: { title?: string, description: string, variant?: string }) => {
        const { title, description, variant } = params;
        
        // Use the UI toast for the UI
        uiToast.toast({
          title,
          description,
          variant: variant as any
        });
        
        // Also show with react-hot-toast for compatibility
        if (variant === 'destructive') {
          hotToast.error(description);
        } else {
          hotToast.success(description);
        }
      },
      // Add other methods for backward compatibility
      success: (message: string, options?: any) => {
        hotToast.success(message, options);
      },
      error: (message: string, options?: any) => {
        hotToast.error(message, options);
      },
      warning: (message: string, options?: any) => {
        hotToast(message, { 
          icon: '⚠️',
          ...options 
        });
      },
      info: (message: string, options?: any) => {
        hotToast(message, { 
          icon: 'ℹ️',
          ...options 
        });
      }
    }
  };
}; 