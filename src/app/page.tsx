"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useAuthenticatedRouting } from '@/lib/utils/auth-routing';

// Placeholder for icons
const PlaceholderIcon = ({ className }: { className?: string }) => <span className={`inline-block h-5 w-5 ${className}`}></span>;

// Simple component to display Unsplash images with attribution
const UnsplashImage = ({
  src,
  alt,
  photographer,
  photographerUrl,
  className
}: {
  src: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <Image 
      src={src} 
      alt={alt}
      fill
      className="object-cover rounded-lg"
    />
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
      Photo by{" "}
      <a 
        href={photographerUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="underline"
      >
        {photographer}
      </a>
      {" "}on{" "}
      <a 
        href="https://unsplash.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="underline"
      >
        Unsplash
      </a>
    </div>
  </div>
);

export default function LandingPage() {
  const { routeToPricing } = useAuthenticatedRouting();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-white dark:from-gray-800 to-gray-100 dark:to-gray-800/80 text-center relative overflow-hidden">
          {/* Hero Background Image */}
          <div className="absolute inset-0 z-0 opacity-20">
            <UnsplashImage
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
              alt="Modern apartment building"
              photographer="Avi Waxman"
              photographerUrl="https://unsplash.com/@aviwaxman"
              className="w-full h-full"
            />
          </div>
          
          {/* Logo Shadow Overlay */}
          <div className="absolute inset-0 z-5 flex items-center justify-center opacity-15">
            <Image 
              src="/TenantArmor-NoText.svg" 
              alt="TenantArmor Logo Background" 
              width={400} 
              height={400}
              className="h-96 w-96 text-gray-600 dark:text-gray-300"
            />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-6">
              Defend Your Rights with the Intelligence of Tomorrow
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              TenantArmor harnesses the power of AI to help you understand your lease, fight evictions, and guide you through every tenant challenge with intelligent insights.
            </p>
            <button 
              onClick={() => routeToPricing()}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* Services Overview Section */}
        <section id="services" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Our Core Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Lease Analysis Card */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
                <div className="mb-6 h-48 relative">
                  <UnsplashImage
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1011&q=80"
                    alt="Legal document with pen"
                    photographer="Gabrielle Henderson"
                    photographerUrl="https://unsplash.com/@gabriellefaithhenderson"
                    className="w-full h-full"
                  />
                </div>
                <PlaceholderIcon className="text-blue-500 mb-4 h-10 w-10" /> {/* Placeholder for Lease Icon */}
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Lease Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Upload your lease, and our AI will break it down, highlighting key clauses, potential issues, and offering actionable recommendations.
                </p>
                <Link href="/dashboard/lease-analysis/upload" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Analyze Your Lease &rarr;
                </Link>
              </div>

              {/* Eviction Response Card */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
                <div className="mb-6 h-48 relative">
                  <UnsplashImage
                    src="https://images.unsplash.com/photo-1589578527966-fdac0f44566c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80"
                    alt="Person working on legal documents"
                    photographer="Towfiqu barbhuiya"
                    photographerUrl="https://unsplash.com/@towfiqu999999"
                    className="w-full h-full"
                  />
                </div>
                <PlaceholderIcon className="text-green-500 mb-4 h-10 w-10" /> {/* Placeholder for Shield Icon */}
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Eviction Response</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Generate customized eviction response letters from templates and access resources to understand your rights.
                </p>
                <Link href="/dashboard/eviction-response" className="font-semibold text-green-600 dark:text-green-400 hover:underline">
                  Get Eviction Response &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* TODO: Add How It Works & Benefits/Features sections later */}

      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-10 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} TenantArmor. All rights reserved.</p>
          <nav className="mt-2 space-x-4">
            <Link href="/about" className="hover:underline">About Us</Link>
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
