import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatBanglaRelativeTime, toBanglaNumber, decodeBanglaText } from "@/lib/bangla-utils";
import { 
  MessageSquare, Send, User, Reply, X, Flag, 
  ChevronDown, ChevronUp, ArrowUpDown, Loader2,
  CheckCircle2, ThumbsUp, ExternalLink
} from "lucide-react";
import { LinkPreviewCard } from "./LinkPreviewCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommentsSectionProps {
  newsId: string;
  authorId?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  display_name: string | null;
  parent_id: string | null;
  replies?: Comment[];
}

type SortOrder = "newest" | "oldest";

export const CommentsSection = ({ newsId, authorId }: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState("");
  const queryClient = useQueryClient();

  // Fetch author profile to check if commenter is the article author
  const { data: authorProfile } = useQuery({
    queryKey: ["author-profile", authorId],
    queryFn: async () => {
      if (!authorId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", authorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
  });

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", newsId, sortOrder],
    queryFn: async () => {
      // Query the secure view that excludes ip_hash
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("comments_public" as any)
        .select("id, content, created_at, display_name, parent_id")
        .eq("news_id", newsId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order("created_at", { ascending: sortOrder === "oldest" }) as { data: Comment[] | null; error: any };
      
      if (error) throw error;

      // Organize into tree structure
      const topLevel: Comment[] = [];
      const repliesMap = new Map<string, Comment[]>();

      (data as Comment[]).forEach(comment => {
        // Safely decode data right after fetching
        comment.content = decodeBanglaText(comment.content);
        if (comment.display_name) {
          comment.display_name = decodeBanglaText(comment.display_name);
        }

        if (comment.parent_id) {
          const replies = repliesMap.get(comment.parent_id) || [];
          replies.push(comment);
          repliesMap.set(comment.parent_id, replies);
        } else {
          topLevel.push(comment);
        }
      });

      // Attach replies to parent comments (replies always sorted oldest first)
      topLevel.forEach(comment => {
        const replies = repliesMap.get(comment.id) || [];
        comment.replies = replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      return topLevel;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${newsId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `news_id=eq.${newsId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [newsId, queryClient]);

  // Submit comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { data, error } = await supabase.functions.invoke('submit-comment', {
        body: {
          news_id: newsId,
          parent_id: parentId || null,
          display_name: displayName.trim() || null,
          content: content.trim()
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setNewComment("");
      setReplyingTo(null);
      const remaining = data?.remaining;
      if (remaining !== undefined && remaining <= 2) {
        toast.success(`মন্তব্য প্রকাশিত। আর ${toBanglaNumber(remaining)}টি মন্তব্য করতে পারবেন।`);
      } else {
        toast.success(replyingTo ? "উত্তর প্রকাশিত হয়েছে" : "মন্তব্য প্রকাশিত হয়েছে");
      }
      queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "মন্তব্য প্রকাশ করতে সমস্যা হয়েছে");
    }
  });

  // Report comment mutation
  const reportMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke('report-comment', {
        body: { comment_id: commentId, reason }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("রিপোর্ট সফলভাবে জমা হয়েছে");
      setReportDialogOpen(false);
      setReportingComment(null);
      setReportReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "রিপোর্ট করতে সমস্যা হয়েছে");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    submitCommentMutation.mutate({ 
      content: newComment, 
      parentId: replyingTo?.id 
    });
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ 
      id: comment.id, 
      name: comment.display_name || "বেনামী" 
    });
  };

  const handleReport = (comment: Comment) => {
    setReportingComment(comment);
    setReportDialogOpen(true);
  };

  const submitReport = () => {
    if (!reportingComment || !reportReason.trim()) return;
    reportMutation.mutate({ 
      commentId: reportingComment.id, 
      reason: reportReason 
    });
  };

  const toggleThread = (commentId: string) => {
    setCollapsedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleLike = (commentId: string) => {
    const likedComments = JSON.parse(localStorage.getItem('janamt_liked_comments') || '[]');
    if (likedComments.includes(commentId)) {
      toast.info("আপনি ইতিমধ্যে লাইক দিয়েছেন");
      return;
    }
    
    // In a real app, we'd send to DB. Here we simulate for UX.
    likedComments.push(commentId);
    localStorage.setItem('janamt_liked_comments', JSON.stringify(likedComments));
    toast.success("লাইক সফল হয়েছে");
    // Optionally trigger a state refresh if DB was used
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  // Check if a display name matches the author
  const isAuthor = (name: string | null) => {
    if (!authorProfile?.full_name || !name) return false;
    return name.trim().toLowerCase() === authorProfile.full_name.trim().toLowerCase();
  };

  // Helper component to parse and render text with link previews
  const FormattedCommentContent = ({ content }: { content: string }) => {
    // Regex for basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    // Split text by URL to render links
    const parts = content.split(urlRegex);
    
    return (
      <>
        <div className="text-foreground text-sm whitespace-pre-wrap break-words mb-2">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a 
                  key={i} 
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </div>
        
        {/* Show preview only for the first URL detected to keep it clean */}
        {urls && urls[0] && (
          <LinkPreviewCard url={urls[0]} className="max-w-md" />
        )}
      </>
    );
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isCollapsed = collapsedThreads.has(comment.id);
    const authorComment = isAuthor(comment.display_name);

    return (
      <div className={`${isReply ? 'ml-8 sm:ml-12 mt-4' : ''}`}>
        <div className="flex gap-3">
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0 ${
            authorComment ? 'bg-accent/20' : 'bg-muted'
          }`}>
            {authorComment ? (
              <CheckCircle2 className={`${isReply ? 'w-4 h-4' : 'w-5 h-5'} text-accent`} />
            ) : (
              <User className={`${isReply ? 'w-4 h-4' : 'w-5 h-5'} text-muted-foreground`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-medium text-sm ${authorComment ? 'text-accent' : 'text-headline'}`}>
                {decodeBanglaText(comment.display_name) || "বেনামী"}
              </span>
              {authorComment && (
                <Badge variant="secondary" className="text-xs py-0 px-1.5 h-5 bg-accent/10 text-accent border-0">
                  লেখক
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatBanglaRelativeTime(comment.created_at)}
              </span>
            </div>
            <FormattedCommentContent content={decodeBanglaText(comment.content)} />
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isReply && (
                <button
                  onClick={() => handleReply(comment)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  উত্তর
                </button>
              )}
                <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                <ThumbsUp className="w-3 h-3" />
                লাইক
                </button>
                <button
                onClick={() => handleReport(comment)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Flag className="w-3 h-3" />
                রিপোর্ট
              </button>
              
              {/* Collapse/Expand button for threads */}
              {hasReplies && !isReply && (
                <button
                  onClick={() => toggleThread(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      {toBanglaNumber(comment.replies!.length)}টি উত্তর দেখুন
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      লুকান
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Replies */}
        {hasReplies && !isCollapsed && (
          <div className="border-l-2 border-muted pl-2 mt-3">
            {comment.replies!.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12 pt-10 border-t border-border">
      {/* Header with sort */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-headline">এই সংবাদ সম্পর্কে আপনার মতামত জানান</h2>
            <p className="text-xs text-muted-foreground">{toBanglaNumber(totalComments)}টি মন্তব্য</p>
          </div>
        </div>
        
        {totalComments > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === "newest" ? "নতুন প্রথমে" : "পুরাতন প্রথমে"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-lg rounded-xl">
              <DropdownMenuItem 
                onClick={() => setSortOrder("newest")}
                className={sortOrder === "newest" ? "bg-primary/5" : ""}
              >
                নতুন প্রথমে
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOrder("oldest")}
                className={sortOrder === "oldest" ? "bg-primary/5" : ""}
              >
                পুরাতন প্রথমে
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-10 space-y-3 bg-card border border-border p-5 rounded-2xl shadow-sm">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-2 rounded-md">
            <Reply className="w-4 h-4" />
            <span>উত্তর দিচ্ছেন: <strong className="text-foreground">{replyingTo.name}</strong></span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="আপনার নাম (ঐচ্ছিক)"
          maxLength={50}
          className="max-w-xs bg-background"
        />
        
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? "আপনার উত্তর লিখুন..." : "আপনার মন্তব্য লিখুন..."}
          className="min-h-[100px] resize-none bg-background"
          maxLength={2000}
        />
        
        <div className="flex items-center justify-between">
          <Button 
            type="submit" 
            disabled={!newComment.trim() || submitCommentMutation.isPending}
            className="gap-2"
          >
            {submitCommentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                প্রকাশ হচ্ছে...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {replyingTo ? "উত্তর দিন" : "মন্তব্য করুন"}
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {toBanglaNumber(newComment.length)}/২০০০
          </span>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium">
            এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যকারী হোন!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              মন্তব্য রিপোর্ট করুন
            </DialogTitle>
            <DialogDescription>
              এই মন্তব্যটি কেন অনুপযুক্ত মনে হচ্ছে তা জানান।
            </DialogDescription>
          </DialogHeader>
          
          {reportingComment && (
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">{decodeBanglaText(reportingComment.display_name) || "বেনামী"}</p>
              <p className="text-muted-foreground line-clamp-2">{decodeBanglaText(reportingComment.content)}</p>
            </div>
          )}
          
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="রিপোর্টের কারণ লিখুন... (অন্তত ৫ অক্ষর)"
            className="min-h-[80px]"
            maxLength={500}
          />
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false);
                setReportReason("");
              }}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={submitReport}
              disabled={reportReason.trim().length < 5 || reportMutation.isPending}
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  জমা হচ্ছে...
                </>
              ) : (
                "রিপোর্ট জমা দিন"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};