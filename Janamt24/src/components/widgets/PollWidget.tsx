import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export function PollWidget() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  
  // Default Fallback / Mock Data
  const [question, setQuestion] = useState("আসন্ন বাজেটে শিক্ষা খাতে বরাদ্দ বৃদ্ধি করা উচিত বলে আপনি মনে করেন কি?");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "হ্যাঁ", votes: 850 },
    { id: "2", text: "না", votes: 120 },
    { id: "3", text: "মন্তব্য নেই", votes: 45 },
  ]);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        // Using "as any" safely here because the user hasn't generated types.ts for the polls table yet
        const { data, error } = await (supabase.from("polls" as any)
          .select("id, question, poll_options(id, text, votes_count)")
          .eq("is_active", true)
          .limit(1)
          .single() as any);
          
        if (data && !error) {
          setActivePollId(data.id);
          setQuestion(data.question);
          setOptions(data.poll_options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: opt.votes_count
          })));

          if (localStorage.getItem(`voted_poll_${data.id}`)) {
            setHasVoted(true);
          }
        }
      } catch (err) {
        console.warn("Polls table not found or network error. Using fallback mock data.");
        if (localStorage.getItem("voted_poll_mock")) {
          setHasVoted(true);
        }
      }
    };
    
    fetchPoll();
  }, []);

  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

  const handleVote = async () => {
    if (selectedOption && !hasVoted) {
      // Optimistic update
      setOptions(opts => 
        opts.map(opt => 
          opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
        )
      );
      setHasVoted(true);
      
      try {
        // If it's a real UUID from DB
        if (selectedOption.length > 5) {
          await (supabase.rpc as any)('vote_poll_option', { p_option_id: selectedOption });
          if (activePollId) localStorage.setItem(`voted_poll_${activePollId}`, "true");
        } else {
          localStorage.setItem("voted_poll_mock", "true");
        }
      } catch (err) {
        console.error("Vote failed:", err);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-border flex flex-col">
      <div className="flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 mx-4 mt-4 text-headline">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black tracking-wide uppercase">পাঠক জরিপ</h3>
      </div>
      
      <div className="p-5 pt-0">
        <p className="text-[15px] font-bold text-headline leading-relaxed mb-5">
          {question}
        </p>

        <div className="space-y-3 mb-6">
          {options.map((option) => {
            const percentage = hasVoted ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <div 
                key={option.id}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
                className={`relative overflow-hidden border ${selectedOption === option.id ? 'border-primary' : 'border-border'} ${!hasVoted ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''} transition-all p-3`}
              >
                {hasVoted && (
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!hasVoted && (
                      <div className={`w-4 h-4 rounded-full border ${selectedOption === option.id ? 'border-[5px] border-primary' : 'border-slate-300 dark:border-slate-600'} transition-all`} />
                    )}
                    <span className={`text-[14px] ${selectedOption === option.id ? 'font-bold text-primary' : 'font-medium text-muted-foreground'}`}>
                      {option.text}
                    </span>
                  </div>
                  {hasVoted && (
                    <span className="text-[13px] font-bold text-primary">{percentage}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!hasVoted ? (
          <Button 
            onClick={handleVote} 
            disabled={!selectedOption}
            className="w-full rounded-none bg-primary hover:bg-primary/90 text-white font-bold h-11"
          >
            ভোট দিন
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-500/10 p-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>আপনার ভোট গ্রহণ করা হয়েছে</span>
          </div>
        )}
        
        <button className="w-full mt-4 flex items-center justify-center gap-1 text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors">
          পুরনো জরিপগুলো দেখুন <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
