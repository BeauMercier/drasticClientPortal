import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - DrasticDigital Client Portal',
  description: 'Login or register for the DrasticDigital Client Portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
} 