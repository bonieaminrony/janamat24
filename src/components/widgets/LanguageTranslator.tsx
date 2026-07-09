import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function LanguageTranslator() {
  useEffect(() => {
    // Only add if not already present
    if (!document.getElementById('google-translate-script')) {
      // Define the init function on the window object
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'bn', // Default language is Bengali
              includedLanguages: 'bn,en,ar,ur', // Allow Bengali, English, Arabic, Urdu
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
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

  return (
    <div className="block overflow-hidden relative shrink-0" style={{ height: '24px', minWidth: '85px' }}>
      <div id="google_translate_element" className="absolute top-[-4px] left-0"></div>
    </div>
  );
}
