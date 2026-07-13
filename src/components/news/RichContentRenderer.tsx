import { useMemo } from "react";
import DOMPurify from "dompurify";
import { sanitizeLinkUrl, sanitizeImageUrl } from "@/lib/url-utils";

interface RichContentRendererProps {
  content: string;
  className?: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
];

// Markdown image pattern: ![alt text](url)
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;

// Check if line is a standalone markdown image
const STANDALONE_IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)]+)\)$/;

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Check if a line is a standalone YouTube URL
function isYouTubeUrl(text: string): string | null {
  const trimmed = text.trim();
  // Check if the entire line is just a YouTube URL
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(trimmed) && trimmed.split(/\s+/).length === 1) {
      return extractYouTubeId(trimmed);
    }
  }
  return null;
}

// Check if line is a standalone markdown image
function isStandaloneImage(text: string): { alt: string; url: string } | null {
  const trimmed = text.trim();
  const match = trimmed.match(STANDALONE_IMAGE_PATTERN);
  if (match) {
    return { alt: match[1], url: match[2] };
  }
  return null;
}

// Embedded image component
function EmbeddedImage({ src, alt }: { src: string; alt: string }) {
  const sanitizedSrc = sanitizeImageUrl(src);
  if (!sanitizedSrc) return null;

  return (
    <figure className="my-6">
      <img
        src={sanitizedSrc}
        alt={alt || "আর্টিকেল ছবি"}
        className="w-full max-w-full h-auto rounded-lg object-contain"
        loading="lazy"
      />
      {alt && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

// Parse text for links and inline images, return React elements
function parseTextWithRichContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Combined pattern for markdown images and URLs
  const combinedPattern = /!\[([^\]]*)\]\(([^)]+)\)|(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[0].startsWith('![')) {
      // It's a markdown image
      const alt = match[1];
      const url = match[2];
      const sanitizedUrl = sanitizeImageUrl(url);
      
      if (sanitizedUrl) {
        parts.push(
          <img
            key={`inline-img-${keyIndex++}`}
            src={sanitizedUrl}
            alt={alt || "ছবি"}
            className="inline-block max-h-64 max-w-full rounded align-middle mx-1"
            loading="lazy"
          />
        );
      }
    } else {
      // It's a URL
      const url = match[0];
      const sanitizedUrl = sanitizeLinkUrl(url);

      if (sanitizedUrl && sanitizedUrl !== '#') {
        parts.push(
          <a
            key={`link-${keyIndex++}`}
            href={sanitizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline break-words"
          >
            {url}
          </a>
        );
      } else {
        parts.push(url);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// YouTube embed component
function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="my-6 aspect-video w-full max-w-full overflow-hidden rounded-lg bg-muted">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
}

// Check if content is HTML (from WYSIWYG editor)
function isHtmlContent(content: string): boolean {
  // Check for common HTML tags
  return /<[a-z][\s\S]*>/i.test(content);
}

// Sanitize HTML content for security (using DOMPurify)
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
  });
}

export function RichContentRenderer({ content, className = "" }: RichContentRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // If content is HTML (from WYSIWYG editor), render it directly
    if (isHtmlContent(content)) {
      const sanitizedHtml = sanitizeHtml(content);
      return (
        <div 
          className="article-body prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }

    // Legacy plain text content - parse for YouTube, images, links
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let keyIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - skip or add spacing
        return;
      }

      // Check if line is a standalone YouTube URL
      const youtubeId = isYouTubeUrl(trimmedLine);
      if (youtubeId) {
        elements.push(
          <YouTubeEmbed key={`yt-${keyIndex++}`} videoId={youtubeId} />
        );
        return;
      }

      // Check if line is a standalone image
      const standaloneImage = isStandaloneImage(trimmedLine);
      if (standaloneImage) {
        elements.push(
          <EmbeddedImage 
            key={`img-${keyIndex++}`} 
            src={standaloneImage.url} 
            alt={standaloneImage.alt} 
          />
        );
        return;
      }

      // Regular paragraph with possible inline links and images
      const parsedContent = parseTextWithRichContent(trimmedLine);
      elements.push(
        <p key={`p-${keyIndex++}`} className="article-body">
          {parsedContent}
        </p>
      );
    });

    return elements;
  }, [content]);

  return (
    <div className={`article-content prose prose-lg max-w-none text-foreground leading-loose ${className}`}>
      {renderedContent}
    </div>
  );
}

// Version with ad insertion support
interface RichContentWithAdsProps {
  content: string;
  renderAd: (index: number) => React.ReactNode;
  adPositions?: number[]; // Paragraph indices after which to show ads
}

export function RichContentWithAds({ 
  content, 
  renderAd, 
  adPositions = [2] 
}: RichContentWithAdsProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // If content is HTML (from WYSIWYG editor), render with ads inserted
    if (isHtmlContent(content)) {
      const sanitizedHtml = sanitizeHtml(content);
      
      // Split by closing paragraph tags to insert ads
      const parts = sanitizedHtml.split('</p>');
      const elements: React.ReactNode[] = [];
      let paragraphCount = 0;
      
      const effectiveAdPositions = [...adPositions].sort((a, b) => a - b);

      parts.forEach((part, index) => {
        if (part.trim()) {
          // Add the paragraph back with closing tag
          const htmlPart = index < parts.length - 1 ? part + '</p>' : part;
          elements.push(
            <div 
              key={`html-${index}`}
              className="article-body prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlPart }}
            />
          );
          
          paragraphCount++;
          
          // Check if we should insert an ad after this paragraph
          if (effectiveAdPositions.includes(paragraphCount)) {
            const adIndex = effectiveAdPositions.indexOf(paragraphCount);
            elements.push(
              <div key={`ad-${index}`} className="my-6 flex justify-center w-full">
                {renderAd(adIndex)}
              </div>
            );
          }
        }
      });

      return elements;
    }

    // Legacy plain text content
    const lines = content.split('\n').filter(line => line.trim());
    const elements: React.ReactNode[] = [];
    let paragraphCount = 0;
    let keyIndex = 0;

    const effectiveAdPositions = [...adPositions].sort((a, b) => a - b);

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check if line is a standalone YouTube URL
      const youtubeId = isYouTubeUrl(trimmedLine);
      if (youtubeId) {
        elements.push(
          <YouTubeEmbed key={`yt-${keyIndex++}`} videoId={youtubeId} />
        );
        // YouTube embeds don't count as paragraphs for ad positioning
        return;
      }

      // Check if line is a standalone image
      const standaloneImage = isStandaloneImage(trimmedLine);
      if (standaloneImage) {
        elements.push(
          <EmbeddedImage 
            key={`img-${keyIndex++}`} 
            src={standaloneImage.url} 
            alt={standaloneImage.alt} 
          />
        );
        // Images don't count as paragraphs for ad positioning
        return;
      }

      // Regular paragraph with possible inline links and images
      const parsedContent = parseTextWithRichContent(trimmedLine);
      elements.push(
        <p key={`p-${keyIndex++}`} className="article-body">
          {parsedContent}
        </p>
      );

      paragraphCount++;

      // Check if we should insert an ad after this paragraph
      if (effectiveAdPositions.includes(paragraphCount)) {
        const adIndex = effectiveAdPositions.indexOf(paragraphCount);
        elements.push(
          <div key={`ad-${keyIndex++}`} className="my-6 flex justify-center w-full">
            {renderAd(adIndex)}
          </div>
        );
      }
    });

    return elements;
  }, [content, renderAd, adPositions]);

  return (
    <div className="article-content prose prose-lg max-w-none text-foreground leading-loose mb-8">
      {renderedContent}
    </div>
  );
}
