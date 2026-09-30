import React, { useState, useEffect, useRef } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Play, Pause, BookOpen, Volume2, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { convertEnglishToBanglaPronunciation } from "@/lib/quran-transliterate";
import { toBanglaNumber } from "@/lib/bangla-utils";
import { SEOHead } from "@/components/seo/SEOHead";

interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
  audio?: string;
  audioSecondary?: string[];
  translation?: string;
  transliteration?: string;
}

const QuranPage = () => {
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedJuz, setSelectedJuz] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [surahDetails, setSurahDetails] = useState<SurahInfo | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingSurah, setIsLoadingSurah] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readingAreaRef = useRef<HTMLDivElement>(null);

  // Fetch Surah List
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const res = await fetch("https://api.alquran.cloud/v1/surah");
        const data = await res.json();
        if (data.code === 200) {
          setSurahs(data.data);
        }
      } catch (error) {
        console.error("Error fetching surah list:", error);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchSurahs();
  }, []);

  // Fetch Selected Surah or Juz
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingSurah(true);
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAyah(null);
      }

      try {
        if (activeTab === 'surah') {
          const res = await fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,bn.bengali,ar.alafasy,en.transliteration`);
          const data = await res.json();
          
          if (data.code === 200 && data.data && data.data.length >= 3) {
            const arabic = data.data[0];
            const translation = data.data[1];
            const audio = data.data[2];
            const transliteration = data.data[3];

            setSurahDetails({
              number: arabic.number,
              name: arabic.name,
              englishName: arabic.englishName,
              englishNameTranslation: arabic.englishNameTranslation,
              numberOfAyahs: arabic.numberOfAyahs,
              revelationType: arabic.revelationType
            });

            const combinedAyahs = arabic.ayahs.map((ayah: any, index: number) => {
              let transText = "";
              if (transliteration?.ayahs?.[index]?.text) {
                try {
                  transText = convertEnglishToBanglaPronunciation(transliteration.ayahs[index].text);
                } catch (e) {
                  console.error("Transliteration error:", e);
                }
              }
              return {
                ...ayah,
                translation: translation?.ayahs?.[index]?.text || "",
                audio: audio?.ayahs?.[index]?.audio || "",
                transliteration: transText,
              };
            });
            
            setAyahs(combinedAyahs);
          }
        } else {
          // Fetch Juz
          const [arabicRes, transRes, audioRes, transliterationRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/juz/${selectedJuz}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/juz/${selectedJuz}/bn.bengali`),
            fetch(`https://api.alquran.cloud/v1/juz/${selectedJuz}/ar.alafasy`),
            fetch(`https://api.alquran.cloud/v1/juz/${selectedJuz}/en.transliteration`)
          ]);
          
          const arabicData = await arabicRes.json();
          const transData = await transRes.json();
          const audioData = await audioRes.json();
          const transliterationData = await transliterationRes.json();
          
          if (arabicData.code === 200) {
            const arabic = arabicData.data;
            const translation = transData.data;
            const audio = audioData.data;
            const transliteration = transliterationData.data;

            setSurahDetails({
              number: selectedJuz,
              name: `পারা ${toBanglaNumber(selectedJuz)}`,
              englishName: `Juz ${selectedJuz}`,
              englishNameTranslation: "পারা",
              numberOfAyahs: arabic.ayahs.length,
              revelationType: "Juz"
            });

            const combinedAyahs = arabic.ayahs.map((ayah: any, index: number) => {
              let transText = "";
              if (transliteration?.ayahs?.[index]?.text) {
                try {
                  transText = convertEnglishToBanglaPronunciation(transliteration.ayahs[index].text);
                } catch (e) {
                  console.error("Transliteration error:", e);
                }
              }
              return {
                ...ayah,
                translation: translation?.ayahs?.[index]?.text || "",
                audio: audio?.ayahs?.[index]?.audio || "",
                transliteration: transText,
              };
            });
            
            setAyahs(combinedAyahs);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingSurah(false);
      }
    };

    fetchData();
  }, [selectedSurah, selectedJuz, activeTab]);

  const handlePlayAyah = (ayahNumber: number, audioUrl: string) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => console.error("Audio play error", e));
        setPlayingAyah(ayahNumber);
        
        audioRef.current.onended = () => {
          // Autoplay next ayah
          const currentIndex = ayahs.findIndex(a => a.number === ayahNumber);
          if (currentIndex < ayahs.length - 1) {
            const nextAyah = ayahs[currentIndex + 1];
            if (nextAyah.audio) {
              handlePlayAyah(nextAyah.number, nextAyah.audio);
            }
          } else {
            setPlayingAyah(null);
          }
        };
      }
    }
  };

  const handleSelectSurah = (number: number) => {
    setSelectedSurah(number);
    setShowMobileList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJuz = (number: number) => {
    setSelectedJuz(number);
    setShowMobileList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.includes(searchTerm)
  );

  return (
    <PublicLayout>
      <SEOHead 
        title="পবিত্র কুরআন শরীফ - বাংলা অনুবাদ ও অডিও" 
        description="পবিত্র কুরআন শরীফের সকল সূরা ও পারা বাংলা উচ্চারণ, অর্থ ও তেলাওয়াত সহ পড়ুন এবং শুনুন।"
        url="/quran"
      />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl flex flex-col lg:flex-row gap-5 sm:gap-6">
        
        {/* Left Sidebar - Surah List */}
        <aside className={`w-full lg:w-[320px] shrink-0 flex-col lg:h-[calc(100vh-140px)] lg:sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden ${showMobileList ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-3.5 sm:p-4 border-b border-border bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-black text-lg sm:text-xl flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              পবিত্র কুরআন
            </h2>
            
            <div className="flex bg-slate-200 dark:bg-slate-700/50 rounded-lg p-1 mb-3">
              <button 
                onClick={() => setActiveTab('surah')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all ${activeTab === 'surah' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                সূরা
              </button>
              <button 
                onClick={() => setActiveTab('juz')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all ${activeTab === 'juz' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                পারা
              </button>
            </div>

            {activeTab === 'surah' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="সূরা খুঁজুন..." 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[60vh] lg:max-h-none flex-1 p-2">
            {isLoadingList && activeTab === 'surah' ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="flex flex-col gap-1">
                {activeTab === 'surah' ? (
                  filteredSurahs.map(surah => (
                    <button 
                      key={`surah-${surah.number}`}
                      onClick={() => handleSelectSurah(surah.number)}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-colors text-left ${selectedSurah === surah.number ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${selectedSurah === surah.number ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {surah.number}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm sm:text-[15px] truncate">{surah.englishName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{surah.englishNameTranslation}</div>
                        </div>
                      </div>
                      <div className="font-arabic text-base sm:text-lg text-slate-600 dark:text-slate-400 shrink-0 ml-2">{surah.name}</div>
                    </button>
                  ))
                ) : (
                  Array.from({length: 30}, (_, i) => i + 1).map(juz => (
                    <button 
                      key={`juz-${juz}`}
                      onClick={() => handleSelectJuz(juz)}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-colors text-left ${selectedJuz === juz ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${selectedJuz === juz ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {juz}
                        </div>
                        <div className="font-bold text-sm sm:text-[15px]">পারা {toBanglaNumber(juz)}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Reading Area */}
        <section ref={readingAreaRef} className={`flex-1 flex-col min-w-0 ${showMobileList ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-3">
            <button 
              onClick={() => setShowMobileList(true)}
              className="flex items-center gap-2 text-primary text-sm font-bold bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-border shadow-sm active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-4 h-4" />
              সূরার তালিকায় ফিরে যান
            </button>
          </div>

          {/* Top Banner Ad */}
          <div className="mb-4 sm:mb-6">
            <UniversalAdBanner placement="quran_top_banner" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
            {isLoadingSurah ? (
               <div className="flex-1 flex items-center justify-center min-h-[400px]">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 font-medium text-sm">সূরা লোড হচ্ছে...</span>
                 </div>
               </div>
            ) : surahDetails && (
               <>
                 {/* Surah Header */}
                 <div className="bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-primary/5 dark:bg-primary/10 border-b border-border p-5 sm:p-8 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/mosque.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <h1 className="text-2xl sm:text-4xl md:text-5xl font-arabic mb-2 text-primary">{surahDetails.name}</h1>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{surahDetails.englishName}</h2>
                      <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
                        {activeTab === 'surah' ? (
                          `${surahDetails.englishNameTranslation} • ${surahDetails.revelationType === 'Meccan' ? 'মাক্কী' : 'মাদানী'} • ${surahDetails.numberOfAyahs} আয়াত`
                        ) : (
                          `${surahDetails.numberOfAyahs} আয়াত`
                        )}
                      </p>
                      
                      {activeTab === 'surah' && surahDetails.number !== 1 && surahDetails.number !== 9 && (
                        <div className="font-arabic text-xl sm:text-2xl md:text-3xl text-slate-700 dark:text-slate-200 mt-2 sm:mt-4 pb-2 border-b-2 border-primary/20 inline-block px-4 sm:px-8">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Ayahs List */}
                 <div className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-12">
                   {ayahs.map(ayah => (
                     <div key={ayah.number} className="flex flex-col gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0 relative group">
                        
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                          {/* Ayah Actions */}
                          <div className="w-full md:w-14 shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary/20 flex items-center justify-center font-bold text-xs sm:text-sm text-primary bg-primary/5">
                              {ayah.numberInSurah}
                            </div>
                            
                            {ayah.audio && (
                              <button 
                                onClick={() => handlePlayAyah(ayah.number, ayah.audio!)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${playingAyah === ayah.number ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              >
                                {playingAyah === ayah.number ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                            )}
                          </div>

                          {/* Ayah Content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
                             <div className="text-right font-arabic text-2xl sm:text-3xl md:text-4xl leading-[2.2] sm:leading-[2.5] text-slate-800 dark:text-slate-100 break-words">
                               {ayah.text}
                             </div>
                             <div className="flex flex-col gap-2.5 sm:gap-3 border-l-4 border-primary/30 pl-3 sm:pl-4 bg-muted/10 py-1.5 sm:py-2 rounded-r">
                               {ayah.transliteration && (
                                 <div className="text-left font-bold text-base sm:text-lg text-[#00895a] dark:text-[#10b981] leading-relaxed">
                                   {ayah.transliteration}
                                 </div>
                               )}
                               <div className="text-left font-normal text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                 {ayah.translation}
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* Inject an Ad randomly every 15 Ayahs */}
                        {ayah.numberInSurah % 15 === 0 && (
                          <div className="w-full flex justify-center py-2">
                            <UniversalAdBanner placement="quran_side_square" />
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
               </>
            )}
          </div>
        </section>

      </div>
      
      <audio ref={audioRef} className="hidden" />
    </PublicLayout>
  );
};

export default QuranPage;
