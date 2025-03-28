import React from "react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <ComingSoon 
        title="Management Features Coming Soon!"
        message="We're working on these management features and will make them available soon. Stay tuned for updates!"
      />
    </div>
  );
} 