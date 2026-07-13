import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

// Get cookie helper
const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

// Set cookie helper
const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/`;
  
  // Set for root domain if applicable
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 2) {
    const domain = parts.slice(-2).join('.');
    document.cookie = `${name}=${value}; path=/; domain=.${domain}`;
  }
};

export function LanguageTranslator() {
  const [lang, setLang] = useState('bn');

  useEffect(() => {
    // Check current cookie value on mount
    const googTrans = getCookie('googtrans');
    if (googTrans) {
      const match = googTrans.match(/\/bn\/([a-z]{2})/);
      if (match && match[1]) {
        setLang(match[1]);
      }
    }

    // Initialize google translate script in background
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'bn',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    setLang(selectedLang);

    if (selectedLang === 'bn') {
      // Clear translation cookies
      setCookie('googtrans', '');
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      const host = window.location.hostname;
      const parts = host.split('.');
      if (parts.length > 2) {
        const domain = parts.slice(-2).join('.');
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
      }
    } else {
      setCookie('googtrans', `/bn/${selectedLang}`);
    }

    // Reload page to apply translation
    window.location.reload();
  };

  return (
    <div className="flex items-center shrink-0">
      {/* Hidden google translate container */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      
      {/* Custom styled select dropdown container */}
      <div className="relative flex items-center">
        <select
          value={lang}
          onChange={handleLangChange}
          className="appearance-none bg-white text-black border border-slate-400 rounded pl-2 pr-6 py-0.5 text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors h-[26px]"
          style={{ minWidth: '92px' }}
        >
          <option value="bn">Bengali</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
          <option value="ur">Urdu</option>
        </select>
        <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}
