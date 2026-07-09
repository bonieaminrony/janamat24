import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Play, Pause, BookOpen, Volume2, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { convertEnglishToBanglaPronunciation } from "@/lib/quran-transliterate";
import { toBanglaNumber } from "@/lib/bangla-utils";

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-bengali">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar - Surah List */}
        <aside className={`w-full lg:w-[300px] shrink-0 flex-col h-[calc(100vh-140px)] sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden ${showMobileList ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-black text-xl flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              পবিত্র কুরআন
            </h2>
            
            <div className="flex bg-slate-200 dark:bg-slate-700/50 rounded-lg p-1 mb-3">
              <button 
                onClick={() => setActiveTab('surah')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'surah' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                সূরা
              </button>
              <button 
                onClick={() => setActiveTab('juz')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'juz' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
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
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            {isLoadingList && activeTab === 'surah' ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="flex flex-col gap-1">
                {activeTab === 'surah' ? (
                  filteredSurahs.map(surah => (
                    <button 
                      key={`surah-${surah.number}`}
                      onClick={() => setSelectedSurah(surah.number)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors text-left ${selectedSurah === surah.number ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedSurah === surah.number ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {surah.number}
                        </div>
                        <div>
                          <div className="font-bold text-[15px]">{surah.englishName}</div>
                          <div className="text-[11px] text-slate-500">{surah.englishNameTranslation}</div>
                        </div>
                      </div>
                      <div className="font-arabic text-lg text-slate-600 dark:text-slate-400">{surah.name}</div>
                    </button>
                  ))
                ) : (
                  Array.from({length: 30}, (_, i) => i + 1).map(juz => (
                    <button 
                      key={`juz-${juz}`}
                      onClick={() => setSelectedJuz(juz)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors text-left ${selectedJuz === juz ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedJuz === juz ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {juz}
                        </div>
                        <div className="font-bold text-[15px]">পারা {toBanglaNumber(juz)}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Reading Area */}
        <section className={`flex-1 flex-col min-w-0 ${showMobileList ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setShowMobileList(true)}
              className="flex items-center gap-2 text-primary font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-border shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
              তালিকায় ফিরে যান
            </button>
          </div>

          {/* Top Banner Ad */}
          <div className="mb-6">
            <UniversalAdBanner placement="quran_top_banner" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
            {isLoadingSurah ? (
               <div className="flex-1 flex items-center justify-center min-h-[400px]">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 font-medium">সূরা লোড হচ্ছে...</span>
                 </div>
               </div>
            ) : surahDetails && (
               <>
                 {/* Surah Header */}
                 <div className="bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-primary/5 dark:bg-primary/10 border-b border-border p-6 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/mosque.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <h1 className="text-3xl md:text-5xl font-arabic mb-2 text-primary">{surahDetails.name}</h1>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{surahDetails.englishName}</h2>
                      <p className="text-sm text-slate-500 mb-6">
                        {activeTab === 'surah' ? (
                          `${surahDetails.englishNameTranslation} • ${surahDetails.revelationType === 'Meccan' ? 'মাক্কী' : 'মাদানী'} • ${surahDetails.numberOfAyahs} আয়াত`
                        ) : (
                          `${surahDetails.numberOfAyahs} আয়াত`
                        )}
                      </p>
                      
                      {activeTab === 'surah' && surahDetails.number !== 1 && surahDetails.number !== 9 && (
                        <div className="font-arabic text-2xl md:text-3xl text-slate-700 dark:text-slate-200 mt-4 pb-2 border-b-2 border-primary/20 inline-block px-8">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Ayahs List */}
                 <div className="flex-1 p-4 md:p-8 space-y-8 md:space-y-12">
                   {ayahs.map(ayah => (
                     <div key={ayah.number} className="flex flex-col gap-8 pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0 relative group">
                        
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Ayah Actions & Ad Square */}
                          <div className="w-full md:w-16 shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start gap-4">
                            <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center font-bold text-primary bg-primary/5">
                              {ayah.numberInSurah}
                            </div>
                            
                            {ayah.audio && (
                              <button 
                                onClick={() => handlePlayAyah(ayah.number, ayah.audio!)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingAyah === ayah.number ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              >
                                {playingAyah === ayah.number ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                              </button>
                            )}
                          </div>

                          {/* Ayah Content */}
                          <div className="flex-1 flex flex-col gap-6">
                             <div className="text-right font-arabic text-3xl md:text-4xl leading-[2.5] text-slate-800 dark:text-slate-100">
                               {ayah.text}
                             </div>
                             <div className="flex flex-col gap-3 border-l-4 border-primary/20 pl-4">
                               {ayah.transliteration && (
                                 <div className="text-left font-bold text-xl text-[#00895a] dark:text-[#10b981] leading-relaxed">
                                   {ayah.transliteration}
                                 </div>
                               )}
                               <div className="text-left font-medium text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                 {ayah.translation}
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* Inject an Ad randomly every 15 Ayahs roughly */}
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

      </main>
      
      <Footer />
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default QuranPage;
