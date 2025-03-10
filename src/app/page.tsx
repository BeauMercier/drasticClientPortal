import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-0">
      <div className="w-full flex flex-col md:flex-row h-screen">
        {/* Left side - Image section */}
        <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-black via-gray-900 to-red-950 flex-col items-center justify-center p-8">
          <div className="z-10 flex flex-col items-center justify-center h-full">
            <Image
              src="/images/logos/drastic-logo.svg"
              alt="Drastic Digital Logo"
              width={300}
              height={100}
              priority
              className="mb-8"
            />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
              Capturing Moments,<br/>Creating Opportunities
            </h2>
            <div className="w-16 h-1 bg-red-600 mb-8"></div>
            <p className="text-gray-300 text-center max-w-md">
              Your digital assets, accessible anytime, anywhere with enterprise-grade security.
            </p>
          </div>
        </div>
        
        {/* Right side - Content section */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8">
          <div className="md:hidden mb-8">
            <Image
              src="/images/logos/drastic-logo.svg"
              alt="Drastic Digital Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          
          <div className="max-w-md w-full">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Welcome to the Client Portal
            </h1>
            
            <p className="text-lg mb-10 text-gray-300">
              Access your projects, files, and communications all in one place. Securely manage your digital assets and collaborate with our team effortlessly.
            </p>
            
            <div className="space-y-4 mb-8">
              <Link 
                href="/login" 
                className="w-full flex items-center justify-center rounded-md py-3 px-8 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="w-full flex items-center justify-center rounded-md py-3 px-8 border border-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                Create Account
              </Link>
            </div>
            
            <div className="flex justify-center">
              <Image 
                src="/images/logos/drastic-icon.svg"
                alt="Drastic Digital Icon" 
                width={48} 
                height={48} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <footer className="w-full bg-black py-4 text-center text-gray-400 text-sm border-t border-gray-900">
        <p>© {new Date().getFullYear()} Drastic Digital. All rights reserved.</p>
        <p className="mt-1">Secure client portal for managing your digital assets.</p>
      </footer>
    </div>
  );
} 