import React from "react";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title?: string;
  message?: string;
  className?: string;
}

export function ComingSoon({
  title = "Coming Soon!",
  message = "This feature is currently under development and will be available soon.",
  className,
}: ComingSoonProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn",
      className
    )}>
      <div className="text-center p-8 max-w-md bg-black/40 rounded-xl border border-white/10 backdrop-blur-sm shadow-xl animate-slideUp">
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-white/80 text-lg mb-3">{message}</p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 