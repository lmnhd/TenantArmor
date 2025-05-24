import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function useAuthenticatedRouting() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const routeToPricing = (returnUrl?: string) => {
    if (isSignedIn) {
      // User is logged in, go directly to pricing
      router.push('/pricing');
    } else {
      // User not logged in, force sign in and redirect to pricing
      const redirectUrl = returnUrl ? `/pricing?returnUrl=${encodeURIComponent(returnUrl)}` : '/pricing';
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    }
  };

  const routeToUpgrade = (currentPath?: string) => {
    // For upgrade buttons, always go to pricing regardless of auth status
    // If not authenticated, they'll be prompted to sign in on the pricing page
    if (isSignedIn) {
      router.push('/pricing');
    } else {
      const redirectUrl = currentPath || '/pricing';
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    }
  };

  return {
    routeToPricing,
    routeToUpgrade,
    isSignedIn
  };
} 