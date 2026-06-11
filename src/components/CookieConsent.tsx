'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  functionality: boolean;
};

export default function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Hide the cookie banner on the pre-launch waitlist landing page
  if (pathname === '/') return null;

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem('cookie-consent');
      if (storedConsent) {
        const parsed = JSON.parse(storedConsent);
        if (parsed && typeof parsed.analytics === 'boolean') {
          setConsent(parsed);
          updateGTMConsent(parsed);
        } else {
          localStorage.removeItem('cookie-consent');
          setTimeout(() => setShowBanner(true), 1000);
        }
      } else {
        setTimeout(() => setShowBanner(true), 1000);
      }
    } catch {
      localStorage.removeItem('cookie-consent');
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const updateGTMConsent = (consentState: ConsentState) => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consentState.analytics ? 'granted' : 'denied',
        ad_storage: consentState.marketing ? 'granted' : 'denied',
        functionality_storage: consentState.functionality ? 'granted' : 'denied',
        ad_user_data: consentState.marketing ? 'granted' : 'denied',
        ad_personalization: consentState.marketing ? 'granted' : 'denied',
      });
    }
  };

  const handleAcceptAll = () => {
    const newConsent = {
      analytics: true,
      marketing: true,
      functionality: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
    setConsent(newConsent);
    updateGTMConsent(newConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const newConsent = {
      analytics: false,
      marketing: false,
      functionality: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
    setConsent(newConsent);
    updateGTMConsent(newConsent);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-[#1BA6A6] p-6 shadow-2xl z-50 animate-in slide-in-from-bottom">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              🍪 Cookie Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to enhance your shopping experience, analyze site traffic, and provide personalized recommendations. 
              By clicking "Accept All", you consent to our use of cookies. Learn more in our{' '}
              <a href="/privacy" className="text-[#1BA6A6] hover:underline font-medium">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleAcceptAll}
                className="bg-[#1BA6A6] hover:bg-[#158a8a] text-white"
              >
                Accept All Cookies
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                Reject Non-Essential
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}