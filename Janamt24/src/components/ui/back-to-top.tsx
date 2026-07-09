import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "./button";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down 400px
      const scrolled = window.scrollY;
      setIsVisible(scrolled > 400);
      
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (windowHeight > 0) {
        setScrollPercent((scrolled / windowHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 animate-fade-in group">
      <button
        onClick={scrollToTop}
        className="relative h-14 w-14 flex items-center justify-center rounded-full bg-card shadow-2xl hover:shadow-primary/20 hover:scale-110 transition-all duration-300 border border-divider"
        aria-label="উপরে যান"
      >
        <svg className="absolute inset-0 -rotate-90" width="56" height="56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted-foreground/10"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            className="text-primary transition-all duration-200"
          />
        </svg>
        <ArrowUp className="h-5 w-5 text-primary group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
