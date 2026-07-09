import { Link } from "react-router-dom";
import { Calendar, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBanglaDateFull, formatBanglaRelativeTime } from "@/lib/bangla-utils";

interface Author {
  full_name: string | null;
  role: string | null;
}

interface Category {
  name: string;
  slug: string;
}

interface ArticleMetadataProps {
  author?: Author | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: Category | null;
  showFullDate?: boolean;
  showLastUpdated?: boolean;
  variant?: "default" | "compact";
}

export function ArticleMetadata({
  author,
  publishedAt,
  updatedAt,
  category,
  showFullDate = false,
  showLastUpdated = false,
  variant = "default",
}: ArticleMetadataProps) {
  const roleLabels: Record<string, string> = {
    admin: "সম্পাদক",
    editor: "সহ-সম্পাদক",
  };

  const isUpdated = updatedAt && publishedAt && 
    new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 60000;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-subtext">
        {author?.full_name && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {author.full_name}
          </span>
        )}
        {publishedAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatBanglaRelativeTime(publishedAt)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-subtext">
      {category && (
        <Link to={`/category/${category.slug}`}>
          <Badge variant="category">{category.name}</Badge>
        </Link>
      )}
      
      {author?.full_name && (
        <span className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span className="font-medium text-foreground">{author.full_name}</span>
          {author.role && (
            <span className="text-muted-foreground">
              ({roleLabels[author.role] || author.role})
            </span>
          )}
        </span>
      )}

      {publishedAt && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {showFullDate ? formatBanglaDateFull(publishedAt) : formatBanglaRelativeTime(publishedAt)}
        </span>
      )}

      {showLastUpdated && isUpdated && (
        <span className="flex items-center gap-1.5 text-muted-foreground italic">
          <Clock className="w-4 h-4" />
          সর্বশেষ সম্পাদনা: {formatBanglaRelativeTime(updatedAt!)}
        </span>
      )}
    </div>
  );
}
