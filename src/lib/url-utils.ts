/**
 * Sanitizes a URL to prevent XSS attacks via javascript: protocol
 * Returns the sanitized URL or a fallback placeholder
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Trim and convert to lowercase for checking
  const trimmedUrl = url.trim();
  const lowerUrl = trimmedUrl.toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:text/html',
    'vbscript:',
  ];
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked potentially malicious URL:', url);
      return null;
    }
  }
  
  // Allow safe protocols and relative URLs
  const safeProtocols = ['http://', 'https://', 'data:image/', '/'];
  const isSafe = safeProtocols.some(protocol => lowerUrl.startsWith(protocol)) || 
                 !trimmedUrl.includes(':'); // relative URLs without protocol
  
  if (!isSafe) {
    console.warn('Blocked URL with unknown protocol:', url);
    return null;
  }
  
  return trimmedUrl;
}

/**
 * Sanitizes a URL for use in href attributes
 * More strict than image URLs - only allows http/https
 * Automatically adds https:// if no protocol is provided
 */
export function sanitizeLinkUrl(url: string | null | undefined): string {
  if (!url) return '#';
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '#';
  
  const lowerUrl = trimmedUrl.toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:'];
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked potentially unsafe link URL:', url);
      return '#';
    }
  }
  
  // Allow http and https
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Allow relative URLs (starting with /)
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }
  
  // For URLs without protocol that look like domains (contain a dot), add https://
  if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
    return `https://${trimmedUrl}`;
  }
  
  // Block everything else
  console.warn('Blocked potentially unsafe link URL:', url);
  return '#';
}
