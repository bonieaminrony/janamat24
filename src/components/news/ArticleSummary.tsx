import { cn } from "@/lib/utils";

interface ArticleSummaryProps {
  summary: string | null;
  showLabel?: boolean;
  className?: string;
  variant?: "default" | "card";
}

export function ArticleSummary({ 
  summary, 
  showLabel = true, 
  className,
  variant = "default" 
}: ArticleSummaryProps) {
  if (!summary) return null;

  return (
    <div className={cn("article-summary", variant === "card" && "article-summary-card", className)}>
      {showLabel && (
        <span className="article-summary-label">সারসংক্ষেপ</span>
      )}
      <p className="article-summary-text">{summary}</p>
    </div>
  );
}
