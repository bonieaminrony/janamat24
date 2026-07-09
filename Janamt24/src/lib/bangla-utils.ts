import { transliterateBanglaToEnglish } from "./transliterate";

// Bangla number conversion
const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  return String(num).replace(/\d/g, (digit) => banglaDigits[parseInt(digit)] || digit);
}

// Bangla month names
const banglaMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const banglaWeekdays = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

// Format date in Bangla style
export function formatBanglaDate(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  const day = toBanglaNumber(d.getDate());
  const month = banglaMonths[d.getMonth()];
  const year = toBanglaNumber(d.getFullYear());
  return `${day} ${month}, ${year}`;
}

// Format date with weekday and time
export function formatBanglaDateFull(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  const weekday = banglaWeekdays[d.getDay()];
  const day = toBanglaNumber(d.getDate());
  const month = banglaMonths[d.getMonth()];
  const year = toBanglaNumber(d.getFullYear());
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const timeStr = `${toBanglaNumber(formattedHours)}:${toBanglaNumber(formattedMinutes)} ${period}`;
  return `${weekday}, ${day} ${month} ${year} | ${timeStr}`;
}

// Format date and time in Bangla (compact)
export function formatBanglaDateTime(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  const day = toBanglaNumber(d.getDate());
  const month = banglaMonths[d.getMonth()];
  const year = toBanglaNumber(d.getFullYear());
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const timeStr = `${toBanglaNumber(formattedHours)}:${toBanglaNumber(formattedMinutes)} ${period}`;
  return `${day} ${month}, ${year} | ${timeStr}`;
}

// Format only time in Bangla
export function formatBanglaTime(date: Date): string {
  if (!date) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${toBanglaNumber(formattedHours)}:${toBanglaNumber(formattedMinutes)}:${toBanglaNumber(formattedSeconds)} ${period}`;
}

// Format relative time in Bangla
export function formatBanglaRelativeTime(date: Date | string): string {
  if (!date) return 'সদ্য প্রকাশিত';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'এইমাত্র';
  if (diffMins < 60) return `${toBanglaNumber(diffMins)} মিনিট আগে`;
  if (diffHours < 24) return `${toBanglaNumber(diffHours)} ঘণ্টা আগে`;
  if (diffDays < 7) return `${toBanglaNumber(diffDays)} দিন আগে`;
  
  return formatBanglaDate(d);
}

// Format view count in Bangla
export function formatBanglaViews(views: number): string {
  if (!views) return '০';
  if (views >= 100000) {
    return `${toBanglaNumber((views / 100000).toFixed(1))} লক্ষ`;
  }
  if (views >= 1000) {
    return `${toBanglaNumber((views / 1000).toFixed(1))} হাজার`;
  }
  return toBanglaNumber(views);
}

// Generate slug from Bangla text
export function generateSlug(text: string): string {
  if (!text) return 'news';
  const transliterated = transliterateBanglaToEnglish(text);
  const slug = transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\x20-\x7F]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return slug || 'news';
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Calculate reading time in Bangla
export function formatBanglaReadingTime(content: string | null | undefined): string {
  if (!content) return '১ মিনিট পড়তে লাগবে';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${toBanglaNumber(minutes)} মিনিট পড়তে লাগবে`;
}

// Safely decode any accidentally URL-encoded Bangla text
export function decodeBanglaText(text: string | null | undefined): string {
  if (!text) return '';
  try {
    if (/%[0-9A-Fa-f]{2}/.test(text)) {
      let decoded = text;
      let prev = '';
      while (decoded !== prev) {
        prev = decoded;
        decoded = decodeURIComponent(decoded);
      }
      return decoded;
    }
    return text;
  } catch (e) {
    return text;
  }
}
