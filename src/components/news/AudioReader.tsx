import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AudioReaderProps {
  title: string;
  excerpt: string | null;
  content: string | null;
}

interface CustomWindow extends Window {
  currentJanamatAudio?: HTMLAudioElement | null;
}

const getGlobalAudio = (): HTMLAudioElement | null => {
  if (typeof window === "undefined") return null;
  return (window as unknown as CustomWindow).currentJanamatAudio || null;
};

const setGlobalAudio = (audio: HTMLAudioElement | null) => {
  if (typeof window === "undefined") return;
  (window as unknown as CustomWindow).currentJanamatAudio = audio;
};

export function AudioReader({ title, excerpt, content }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const chunksRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentIndexRef = useRef(0);
  
  const speedRef = useRef(1.0);
  const voiceGenderRef = useRef("male");

  // Sync refs to use inside event listeners safely
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Clean HTML, Markdown, URLs, and symbols for speech synthesis
  const cleanTextForSpeech = (text: string) => {
    if (!text) return "";
    try {
      let clean = text;

      // 1. Remove script and style tags along with content
      clean = clean.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");

      // 2. Remove other HTML tags
      clean = clean.replace(/<[^>]+>/g, " ");

      // 3. Remove Markdown images: ![alt](url) -> keep alt text
      clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ");

      // 4. Remove Markdown links: [text](url) -> keep link text
      clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ");

      // 5. Remove standalone URLs (http://... or https://...)
      clean = clean.replace(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi, " ");

      // 6. Decode HTML entities using browser's native parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, "text/html");
      clean = doc.body.textContent || doc.body.innerText || clean;

      // 7. Remove symbols that synthesizers read aloud (slashes, stars, hashtags, etc.)
      clean = clean.replace(/\//g, " ").replace(/\\/g, " ");
      clean = clean.replace(/[*_#`~]/g, " ");

      // 8. Clean extra spaces
      return clean.replace(/\s+/g, " ").trim();
    } catch (e) {
      // Fallback in case of DOMParser failure
      return text
        .replace(/<[^>]+>/g, " ")
        .replace(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi, " ")
        .replace(/\//g, " ").replace(/\\/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  };

  // Split text into neural TTS friendly chunks (max 800 characters for smooth, continuous flow)
  const splitIntoSpeechChunks = (textToSplit: string, maxLen = 800) => {
    const sentences = textToSplit
      .split(/[।.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const resultChunks: string[] = [];

    for (const sentence of sentences) {
      if (sentence.length <= maxLen) {
        resultChunks.push(sentence);
      } else {
        // Split long sentences by commas or spaces
        const subparts = sentence.split(/[,，\s]+/);
        let currentChunk = "";

        for (const part of subparts) {
          if ((currentChunk + " " + part).trim().length <= maxLen) {
            currentChunk = currentChunk ? currentChunk + " " + part : part;
          } else {
            if (currentChunk) resultChunks.push(currentChunk);
            currentChunk = part;
          }
        }
        if (currentChunk) {
          resultChunks.push(currentChunk);
        }
      }
    }

    return resultChunks.filter((c) => c.length > 0);
  };

  // Recalculate sentences when text changes and reset player
  useEffect(() => {
    // 1. Force stop the active playing queue first
    isPlayingRef.current = false;
    isPausedRef.current = false;
    
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);

    // 2. Stop and clear any active audios and their event listeners
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const globalAudio = getGlobalAudio();
    if (globalAudio) {
      globalAudio.onended = null;
      globalAudio.onerror = null;
      globalAudio.pause();
      setGlobalAudio(null);
    }

    // 3. Set up the new content
    const cleanTitle = cleanTextForSpeech(title);
    const cleanExcerpt = excerpt ? cleanTextForSpeech(excerpt) : "";
    const cleanContent = content ? cleanTextForSpeech(content) : "";
    
    const fullText = `${cleanTitle}. ${cleanExcerpt}. ${cleanContent}`;
    chunksRef.current = splitIntoSpeechChunks(fullText);

    // 4. Return cleanup to do the same when component completely unmounts
    return () => {
      isPlayingRef.current = false;
      isPausedRef.current = false;
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const unmountGlobalAudio = getGlobalAudio();
      if (unmountGlobalAudio) {
        unmountGlobalAudio.onended = null;
        unmountGlobalAudio.onerror = null;
        unmountGlobalAudio.pause();
        setGlobalAudio(null);
      }
    };
  }, [title, excerpt, content]);

  const playChunk = (index: number) => {
    if (index >= chunksRef.current.length) {
      // Completed reading the article
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(index);
    const chunk = chunksRef.current[index];
    
    // Play via local python proxy to bypass CORS/Referrer blocks (cache-busted with voice parameter)
    const url = `http://localhost:8000/tts?text=${encodeURIComponent(chunk)}&voice=${voiceGenderRef.current}&t=${Date.now()}`;

    const prevGlobalAudio = getGlobalAudio();
    if (prevGlobalAudio) {
      prevGlobalAudio.pause();
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    setGlobalAudio(audio);
    
    audio.playbackRate = speedRef.current;
    audio.onloadedmetadata = () => {
      audio.playbackRate = speedRef.current;
    };
    audio.oncanplay = () => {
      audio.playbackRate = speedRef.current;
    };
    audioRef.current = audio;

    audio.onended = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        playChunk(index + 1);
      }
    };

    audio.onerror = (e) => {
      console.warn("Proxy play failed, trying direct Google TTS fallback:", e);
      
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q=${encodeURIComponent(chunk)}&t=${Date.now()}`;
      
      const errorGlobalAudio = getGlobalAudio();
      if (errorGlobalAudio) {
        errorGlobalAudio.pause();
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const fallbackAudio = new Audio(fallbackUrl);
      setGlobalAudio(fallbackAudio);
      
      try {
        // Bypass Google's referrer block by omitting referrer
        fallbackAudio.referrerPolicy = "no-referrer";
      } catch (err) {
        console.warn("Unable to set referrer policy:", err);
      }
      
      fallbackAudio.playbackRate = speedRef.current;
      fallbackAudio.onloadedmetadata = () => {
        fallbackAudio.playbackRate = speedRef.current;
      };
      fallbackAudio.oncanplay = () => {
        fallbackAudio.playbackRate = speedRef.current;
      };
      audioRef.current = fallbackAudio;

      fallbackAudio.onended = () => {
        if (isPlayingRef.current && !isPausedRef.current) {
          playChunk(index + 1);
        }
      };

      fallbackAudio.play().catch((playErr) => {
        console.error("Direct fallback play failed:", playErr);
        if (isPlayingRef.current && !isPausedRef.current) {
          playChunk(index + 1);
        }
      });
    };

    audio.play().catch((err) => {
      console.warn("Proxy play trigger failed, calling fallback:", err);
      // Fallback directly
      if (audio.onerror) {
        audio.onerror(new Event("error") as unknown as ErrorEvent);
      }
    });
  };

  const handlePlay = () => {
    if (chunksRef.current.length === 0) return;

    if (isPaused) {
      setIsPaused(false);
      isPlayingRef.current = true;
      isPausedRef.current = false;
      
      const currentGlobalAudio = getGlobalAudio();
      if (currentGlobalAudio && currentGlobalAudio !== audioRef.current) {
        currentGlobalAudio.pause();
      }

      if (audioRef.current) {
        setGlobalAudio(audioRef.current);
        audioRef.current.playbackRate = speedRef.current;
        audioRef.current.play().catch((err) => {
          console.error("Failed to resume audio:", err);
        });
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      isPlayingRef.current = true;
      isPausedRef.current = false;
      playChunk(currentIndexRef.current);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const currentGlobalAudio = getGlobalAudio();
    if (currentGlobalAudio === audioRef.current && currentGlobalAudio) {
      currentGlobalAudio.pause();
    }
  };

  const togglePlay = () => {
    if (isPlayingRef.current && !isPausedRef.current) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const toBanglaNum = (num: number) => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
  };

  if (chunksRef.current.length === 0) {
    return null;
  }

  const progressPercent = chunksRef.current.length > 0 
    ? Math.round((currentIndex / chunksRef.current.length) * 100) 
    : 0;

  return (
    <Button
      variant={isPlaying && !isPaused ? "default" : "outline"}
      size="sm"
      onClick={togglePlay}
      className="rounded-sm gap-2 border-border/50 font-bold"
    >
      {isPlaying && !isPaused ? (
        <>
          <Pause className="w-4 h-4 fill-white animate-pulse" />
          <span>অডিও থামান ({toBanglaNum(progressPercent)}%)</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-current animate-pulse" />
          <span>খবরটি অডিও শুনুন</span>
        </>
      )}
    </Button>
  );
}
