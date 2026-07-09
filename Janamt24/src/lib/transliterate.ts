const charMap: Record<string, string> = {
  // Vowels
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  
  // Consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',

  // Common Numbers
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Professional Transliteration Engine for News Slugs
 */
export function transliterateBanglaToEnglish(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let result = '';
  const processedText = text
    .replace(/্য/g, 'y') 
    .replace(/্র/g, 'r')
    .replace(/্/g, ''); // Remove hasanta
    
  for (let i = 0; i < processedText.length; i++) {
    const char = processedText[i];
    if (charMap[char] !== undefined) {
      result += charMap[char];
    } else if (/[a-zA-Z0-9\s-]/.test(char)) {
      result += char;
    }
  }
  
  return result;
}
