export function convertEnglishToBanglaPronunciation(englishText: string): string {
  if (!englishText) return "";

  let text = englishText.toLowerCase();

  // Basic cleaning
  text = text.replace(/[`']/g, "’"); // standard apostrophe
  
  // Specific full word mappings (to ensure highest accuracy for common words)
  const fullWordMap: Record<string, string> = {
    'bismillaahir': 'বিসমিল্লাহির',
    'rahmaanir': 'রাহমানির',
    'raheem': 'রাহিম',
    'alhamdu': 'আলহামদু',
    'lillaahi': 'লিল্লাহি',
    'rabbil': 'রাব্বিল',
    "'aalameen": 'আলামিন',
    'aalameen': 'আলামিন',
    'ar-rahmaanir-raheem': 'আর-রাহমানির-রাহিম',
    'maaliki': 'মালিকি',
    'yawmid-deen': 'ইয়াওমিদ-দ্বীন',
    'iyyaaka': 'ইয়্যাকা',
    "na'budu": 'নাবুদু',
    'wa': 'ওয়া',
    'lyyaaka': 'ইয়্যাকা',
    "nasta'een": 'নাস্তাইন',
    'ihdinas-siraatal-mustaqeem': 'ইহদিনাস-সিরাতাল-মুস্তাকিম',
    'siraatal-lazeena': 'সিরাতাল-লাজিনা',
    "an'amta": 'আনআমতা',
    "'alaihim": 'আলাইহিম',
    'ghayril-maghdoobi': 'গাইরিল-মাগদুবি',
    'lad-daaalleen': 'লাদ-দোয়াল্লিন',
    'qul': 'কুল',
    'huwal': 'হুওয়াল',
    'laahu': 'লাহু',
    'ahad': 'আহাদ',
    'allahus': 'আল্লাহুস',
    'samad': 'সামাদ',
    'lam': 'লাম',
    'yalid': 'ইয়ালিদ',
    'yoolad': 'ইউলাদ',
    'yakul': 'ইয়াকুল',
    'kufuwan': 'কুফুওয়ান'
  };

  const words = text.split(/\s+/);
  const result = words.map(word => {
    let w = word.trim();
    const cleanW = w.replace(/[.,;!?"()]/g, ''); // strip punctuation
    
    if (fullWordMap[cleanW]) {
      return w.replace(cleanW, fullWordMap[cleanW]);
    }

    // Phonetic replacements
    // Consonant clusters
    w = w.replace(/sh/g, 'শ')
         .replace(/ch/g, 'চ')
         .replace(/th/g, 'থ')
         .replace(/kh/g, 'খ')
         .replace(/gh/g, 'ঘ')
         .replace(/ph/g, 'ফ')
         .replace(/dh/g, 'ধ')
         .replace(/bh/g, 'ভ')
         .replace(/jh/g, 'ঝ');
         
    // Vowels
    w = w.replace(/aa/g, 'া')
         .replace(/ee/g, 'ী')
         .replace(/oo/g, 'ূ')
         .replace(/ou/g, 'ও')
         .replace(/au/g, 'আও');
         
    w = w.replace(/a/g, 'া')
         .replace(/e/g, 'ে')
         .replace(/i/g, 'ি')
         .replace(/o/g, 'ো')
         .replace(/u/g, 'ু')
         .replace(/y/g, 'য়');

    // Consonants
    w = w.replace(/b/g, 'ব')
         .replace(/c/g, 'ক')
         .replace(/d/g, 'দ')
         .replace(/f/g, 'ফ')
         .replace(/g/g, 'গ')
         .replace(/h/g, 'হ')
         .replace(/j/g, 'জ')
         .replace(/k/g, 'ক')
         .replace(/l/g, 'ল')
         .replace(/m/g, 'ম')
         .replace(/n/g, 'ন')
         .replace(/p/g, 'প')
         .replace(/q/g, 'ক')
         .replace(/r/g, 'র')
         .replace(/s/g, 'স')
         .replace(/t/g, 'ত')
         .replace(/v/g, 'ভ')
         .replace(/w/g, 'ও')
         .replace(/z/g, 'য');

    // Fix leading vowel marks (since 'a' maps to 'া' above, but should be 'আ' at start of a word)
    w = w.replace(/^া/, 'আ')
         .replace(/^ি/, 'ই')
         .replace(/^ী/, 'ঈ')
         .replace(/^ু/, 'উ')
         .replace(/^ূ/, 'ঊ')
         .replace(/^ে/, 'এ')
         .replace(/^ো/, 'ও');
         
    // Fix apostrophe start
    w = w.replace(/^’া/, 'আ')
         .replace(/^’ি/, 'ই')
         .replace(/^’ী/, 'ঈ')
         .replace(/^’ু/, 'উ')
         .replace(/^’ূ/, 'ঊ');

    // Fix hyphen vowel marks
    w = w.replace(/-া/g, '-আ')
         .replace(/-ি/g, '-ই')
         .replace(/-ী/g, '-ঈ')
         .replace(/-ু/g, '-উ')
         .replace(/-ূ/g, '-ঊ')
         .replace(/-ে/g, '-এ')
         .replace(/-ো/g, '-ও');

    return w;
  });

  return result.join(' ');
}
