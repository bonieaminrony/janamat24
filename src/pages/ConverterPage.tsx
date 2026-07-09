import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftRight, Copy, RefreshCw, Type, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import the converter functions
import { ConvertToUnicode, ConvertToASCII } from "bijoy-unicode-converter";

const ConverterPage = () => {
  const [unicodeText, setUnicodeText] = useState("");
  const [bijoyText, setBijoyText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'bn-BD';

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
          }
          
          if (currentTranscript.trim()) {
            setUnicodeText((prev) => {
              const newText = prev ? prev + " " + currentTranscript.trim() : currentTranscript.trim();
              const converted = ConvertToASCII("bijoy", newText);
              setBijoyText(converted);
              return newText;
            });
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          toast({
            title: "ভয়েস টাইপিং এরর",
            description: "মাইক্রোফোনে সমস্যা হয়েছে অথবা পারমিশন নেই।",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "সমর্থিত নয়",
        description: "আপনার ব্রাউজারে ভয়েস টাইপিং সাপোর্ট করে না। দয়া করে Google Chrome ব্যবহার করুন।",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "ভয়েস টাইপিং চালু হয়েছে",
          description: "এখন আপনি বাংলায় কথা বলে টাইপ করতে পারেন।",
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUnicodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUnicodeText(text);
    if (text) {
      const converted = ConvertToASCII("bijoy", text);
      setBijoyText(converted);
    } else {
      setBijoyText("");
    }
  };

  const handleBijoyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBijoyText(text);
    if (text) {
      const converted = ConvertToUnicode("bijoy", text);
      setUnicodeText(converted);
    } else {
      setUnicodeText("");
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "কপি করা হয়েছে!",
      description: `${label} সফলভাবে ক্লিপবোর্ডে কপি হয়েছে।`,
    });
  };

  const clearAll = () => {
    setUnicodeText("");
    setBijoyText("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-bengali">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <UniversalAdBanner placement="header" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Type className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">বাংলা কনভার্টার</h1>
              <p className="text-slate-500 dark:text-slate-400">বিজয় থেকে ইউনিকোড এবং ইউনিকোড থেকে বিজয় রূপান্তর</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 relative">
            {/* Unicode Box */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-lg text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  ইউনিকোড 
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-normal">অভ্র/প্রমিত</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(unicodeText, "ইউনিকোড লেখা")} className="h-8 text-xs font-bold">
                    <Copy className="w-3.5 h-3.5 mr-1" /> কপি
                  </Button>
                </div>
              </div>
              
              {/* Textarea with embedded Google Translate style Microphone */}
              <div className="relative">
                <Textarea 
                  placeholder="এখানে ইউনিকোড লেখা পেস্ট বা টাইপ করুন..." 
                  className="h-64 resize-none text-xl font-medium p-4 pb-16 rounded-xl focus-visible:ring-primary/20 bg-slate-50 dark:bg-slate-950"
                  value={unicodeText}
                  onChange={handleUnicodeChange}
                />
                
                {/* Embedded Microphone Button */}
                <div className="absolute bottom-4 left-4">
                  <Button 
                    variant={isListening ? "default" : "outline"} 
                    size="icon" 
                    onClick={toggleListening} 
                    title="ভয়েস টাইপিং"
                    className={`w-12 h-12 rounded-full shadow-md transition-all duration-300 hover:scale-105 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-red-500/30 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary'}`}
                  >
                    {isListening ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                </div>
                
                {/* Listening indicator text */}
                {isListening && (
                  <div className="absolute bottom-6 left-20 text-sm font-semibold text-red-500 animate-pulse">
                    শুনছি... কথা বলুন
                  </div>
                )}
              </div>
            </div>

            {/* Middle Divider Icon */}
            <div className="hidden md:flex absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-800 z-10 shadow-sm">
              <ArrowLeftRight className="w-5 h-5 text-slate-400" />
            </div>

            {/* Bijoy Box */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-lg text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  বিজয়
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-normal">Bijoy Bayanno</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(bijoyText, "বিজয় লেখা")} className="h-8 text-xs font-bold">
                    <Copy className="w-3.5 h-3.5 mr-1" /> কপি
                  </Button>
                </div>
              </div>
              <Textarea 
                placeholder="এখানে বিজয় লেখা পেস্ট বা টাইপ করুন..." 
                className="h-64 resize-none text-xl font-medium p-4 rounded-xl focus-visible:ring-primary/20 bg-slate-50 dark:bg-slate-950 font-bijoy"
                value={bijoyText}
                onChange={handleBijoyChange}
              />
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="destructive" onClick={clearAll} className="rounded-full px-8 font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> সব মুছুন
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
           <UniversalAdBanner placement="article_bottom" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConverterPage;
