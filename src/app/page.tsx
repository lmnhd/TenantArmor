import Link from 'next/link';

// Placeholder for icons
const PlaceholderIcon = ({ className }: { className?: string }) => <span className={`inline-block h-5 w-5 ${className}`}></span>;

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header/Navigation */}
      <header className="py-4 px-6 md:px-10 shadow-md bg-white dark:bg-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            TenantArmor
          </Link>
          <nav className="space-x-4">
            {/* Placeholder Nav Links */}
            <Link href="#services" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Services</Link>
            <Link href="/dashboard/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Login</Link>
            <Link href="/dashboard/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-white dark:from-gray-800 to-gray-100 dark:to-gray-800/80 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-6">
              Empowering Tenants with Clear Legal Insights.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              TenantArmor helps you understand your lease and navigate tenant rights with AI-powered analysis and resources.
            </p>
            <Link href="/dashboard/signup" className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg">
              Get Started Free
            </Link>
          </div>
        </section>

        {/* Services Overview Section */}
        <section id="services" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Our Core Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Lease Analysis Card */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
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
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
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
