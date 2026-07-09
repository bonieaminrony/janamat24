import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewData {
  title: string;
  description: string;
  image_url: string;
  domain: string;
  url: string;
}

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export function LinkPreviewCard({ url, className }: LinkPreviewCardProps) {
  const { data: preview, isLoading, isError } = useQuery<LinkPreviewData>({
    queryKey: ["link-preview", url],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("link-preview", {
        body: { url },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  if (isLoading) {
    return (
      <div className={cn("border border-border rounded-xl overflow-hidden bg-card/50 my-2", className)}>
        <div className="flex flex-col sm:flex-row h-full">
          <Skeleton className="w-full sm:w-1/3 aspect-[16/9] sm:h-auto" />
          <div className="p-3 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all inline-flex items-center gap-1"
      >
        {url}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group border border-border rounded-xl overflow-hidden bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md my-2 block no-underline",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row h-full">
        {preview.image_url && (
          <div className="w-full sm:w-1/3 aspect-[16/9] sm:h-auto overflow-hidden shrink-0 bg-muted">
            <img 
              src={preview.image_url} 
              alt={preview.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement?.classList.add('hidden');
              }}
            />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            {preview.domain}
          </div>
          <h4 className="text-sm font-bold text-headline line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1">
            {preview.title}
          </h4>
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {preview.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
