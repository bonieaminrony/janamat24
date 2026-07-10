import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

interface BlurRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ImageUpload({ value, onChange, bucket = "news-images" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Blur & Adjustment states
  const [showBlurDialog, setShowBlurDialog] = useState(false);
  const [blurringImage, setBlurringImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // Photo adjustments
  const [brightness, setBrightness] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(0);     // -100 to 100
  const [saturate, setSaturate] = useState(0);     // -100 to 100 (Color/Saturation)
  const [sharpness, setSharpness] = useState(0);   // 0 to 100
  const [blurRegions, setBlurRegions] = useState<BlurRegion[]>([]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Set adjustments filter
    const bValue = 100 + brightness;
    const cValue = 100 + contrast;
    const sValue = 100 + saturate;

    ctx.save();
    let filterString = `brightness(${bValue}%) contrast(${cValue}%) saturate(${sValue}%)`;
    if (sharpness > 0) {
      filterString += ` url(#sharpen-filter)`;
    }
    ctx.filter = filterString;
    
    // 3. Draw original image with adjustments
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 4. Draw all blur regions
    blurRegions.forEach((region) => {
      const { x, y, w, h } = region;
      if (w > 5 && h > 5) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
          ctx.save();
          ctx.filter = "blur(18px)";
          ctx.drawImage(tempCanvas, x, y, w, h);
          ctx.restore();
        }
      }
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [brightness, contrast, saturate, sharpness, blurRegions]);

  const initBlurCanvas = (imageUrl: string) => {
    setBrightness(0);
    setContrast(0);
    setSaturate(0);
    setSharpness(0);
    setBlurRegions([]);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        redrawCanvas();
      }
    };
    img.onerror = () => {
      console.warn("CORS image load failed, retrying with proxy...");
      const proxyImg = new window.Image();
      proxyImg.crossOrigin = "anonymous";
      proxyImg.onload = () => {
        originalImageRef.current = proxyImg;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = proxyImg.naturalWidth;
          canvas.height = proxyImg.naturalHeight;
          redrawCanvas();
        }
      };
      proxyImg.onerror = (e) => {
        console.error("Proxy image load failed too:", e);
        toast({
          variant: "destructive",
          title: "ত্রুটি",
          description: "ছবিটি লোড করা সম্ভব হয়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।"
        });
      };
      
      const isDev = window.location.hostname === "localhost" && window.location.port === "5173";
      const proxyUrl = isDev
        ? `http://localhost:8000/proxy.php?action=image&url=${encodeURIComponent(imageUrl)}`
        : `/proxy.php?action=image&url=${encodeURIComponent(imageUrl)}`;
      proxyImg.src = proxyUrl;
    };
    
    const cacheBuster = `t=${new Date().getTime()}`;
    img.src = imageUrl + (imageUrl.includes("?") ? "&" : "?") + cacheBuster;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.min(startPos.x, currentPos.x) * scaleX;
    const y = Math.min(startPos.y, currentPos.y) * scaleY;
    const w = Math.abs(startPos.x - currentPos.x) * scaleX;
    const h = Math.abs(startPos.y - currentPos.y) * scaleY;

    if (w > 5 && h > 5) {
      setBlurRegions((prev) => [...prev, { x, y, w, h }]);
    }
  };

  const resetBlur = () => {
    setBlurRegions([]);
    setBrightness(0);
    setContrast(0);
    setSaturate(0);
    setSharpness(0);
  };

  const saveBlur = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setBlurringImage(true);
    try {
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) {
            toast({ title: "সংরক্ষণ ব্যর্থ", description: "ইমেজ ডাটা তৈরি করা সম্ভব হয়নি", variant: "destructive" });
            setBlurringImage(false);
            return;
          }

          console.log("Blob generated for upload. Size:", blob.size, "Type:", blob.type);
          const fileExt = "jpg";
          const fileName = `${Date.now()}-blurred-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          // Wrap in standard File object to ensure compatibility with Supabase storage upload
          const fileToUpload = new File([blob], fileName, { type: "image/jpeg" });

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileToUpload, {
              contentType: "image/jpeg",
              upsert: true
            });
            
          if (uploadError) {
            console.error("Supabase storage upload error:", uploadError);
            toast({ 
              title: "সংরক্ষণ ব্যর্থ", 
              description: `সার্ভারে ছবি পাঠাতে সমস্যা হয়েছে: ${uploadError.message}`, 
              variant: "destructive" 
            });
            return;
          }

          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
          console.log("Uploaded successfully. Public URL:", publicUrl);
          
          onChange(publicUrl);
          setUrlInput(publicUrl);
          setShowBlurDialog(false);
          toast({ title: "সফল!", description: "ব্লার করা ছবি সংরক্ষণ সম্পন্ন হয়েছে" });
        } catch (innerError: any) {
          console.error("Error inside toBlob callback:", innerError);
          toast({ 
            title: "সংরক্ষণ ব্যর্থ", 
            description: innerError?.message || "ব্লার করা ছবি আপলোড করতে সমস্যা হয়েছে", 
            variant: "destructive" 
          });
        } finally {
          setBlurringImage(false);
        }
      }, "image/jpeg", 0.9);
    } catch (error: any) {
      console.error("Error starting toBlob:", error);
      toast({ title: "সংরক্ষণ ব্যর্থ", description: error?.message || "ব্লার করা ছবি সেভ করতে সমস্যা হয়েছে", variant: "destructive" });
      setBlurringImage(false);
    }
  };

  const applyWatermark = (file: File, watermarkText: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image(); // Avoid variable shadowing
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Watermark styling
        const fontSize = Math.max(20, Math.floor(img.width * 0.04)); // Responsive font size
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; // White translucent
        
        // Shadow for visibility on bright backgrounds
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        // Position bottom right with padding
        const padding = fontSize;
        ctx.fillText(watermarkText, img.width - padding, img.height - padding);

        // Optional: Draw a secondary watermark/logo shape or subtle text diagonally
        
        // Convert to Blob
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, file.type, 0.9); // Maintain original format and 90% quality
      };
      img.onerror = () => reject(new Error("Image overlay failed to load"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e) {
      file = (e as React.ChangeEvent<HTMLInputElement>).target.files?.[0];
    } else {
      e.preventDefault();
      file = (e as React.DragEvent).dataTransfer.files?.[0];
    }

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "অনুমোদিত ফাইল নয়", description: "JPG, PNG, WebP, GIF ব্যবহার করুন", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ফাইল অনেক বড়", description: "সর্বোচ্চ ৫ এমবি অনুমোদিত", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Apply Watermark
      const watermarkedBlob = await applyWatermark(file, "জনমত ২৪");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, watermarkedBlob, {
          contentType: file.type,
          upsert: true
        });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(publicUrl);
      setUrlInput(publicUrl);
      toast({ title: "সফল!", description: "ছবি আপলোড সম্পন্ন হয়েছে" });
    } catch (error) {
      console.error(error);
      toast({ title: "আপলোড ব্যর্থ", description: "সার্ভারে ছবি পাঠাতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setUploading(false);
      setIsDragOver(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 h-auto grid grid-cols-2">
          <TabsTrigger 
            value="upload" 
            className="rounded-xl py-3 font-bold gap-2 text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            <Upload className="w-4 h-4 shadow-sm" /> আপলোড
          </TabsTrigger>
          <TabsTrigger 
            value="url" 
            className="rounded-xl py-3 font-bold gap-2 text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            <LinkIcon className="w-4 h-4 shadow-sm" /> URL লিংক
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <div 
            className={cn(
              "group relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer overflow-hidden",
              isDragOver 
                ? "border-slate-900 dark:border-slate-400 bg-slate-50 dark:bg-slate-800/50 scale-[0.98]" 
                : "border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/20",
              uploading && "opacity-50 pointer-events-none"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            
            <div className="relative z-10 space-y-4">
               <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-xl rounded-3xl flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {uploading ? <Sparkles className="w-10 h-10 text-slate-900 dark:text-white animate-pulse" /> : <ImageIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />}
               </div>
               <div>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {uploading ? "আপলোড হচ্ছে..." : "ছবিটি এখানে টেনে আনুন"}
                  </p>
                  {!uploading && (
                    <p className="text-sm font-bold text-primary mt-1">
                      অথবা ব্রাউজ করতে ক্লিক করুন
                    </p>
                  )}
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                    JPG, PNG, WEBP • ৫ এমবি সর্বোচ্চ
                  </p>
               </div>
            </div>
            
            {/* Background Mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(15,23,42,0.03),transparent)] pointer-events-none" />
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-14 rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-6 font-bold text-slate-900 dark:text-white"
            />
            <Button type="button" onClick={() => onChange(urlInput)} className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground font-black">
              সেট করুন
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* High Quality Preview */}
      {value && (
        <div className="relative group/preview animate-in zoom-in-95 duration-500">
          <div className="overflow-hidden rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
             <img src={value} alt="Preview" className="w-full h-auto max-h-[400px] object-cover transition-transform duration-1000 group-hover/preview:scale-105" />
          </div>
          <div className="absolute top-6 right-6 flex items-center gap-3 opacity-0 group-hover/preview:opacity-100 transition-all duration-300">
            <Button
              type="button"
              variant="secondary"
              className="h-12 gap-2 px-4 rounded-2xl shadow-2xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 active:scale-95"
              onClick={() => {
                setShowBlurDialog(true);
                setTimeout(() => initBlurCanvas(value), 100);
              }}
            >
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>অংশ ব্লার করুন</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-2xl shadow-2xl active:scale-95"
              onClick={() => { onChange(""); setUrlInput(""); }}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Blur Editor Dialog */}
      <Dialog open={showBlurDialog} onOpenChange={setShowBlurDialog}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-none rounded-[2rem] p-6 md:p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              <span>ছবির মুখ বা নির্দিষ্ট অংশ ব্লার করুন</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
              ছবিতে যে অংশটি ব্লার করতে চান, মাউস দিয়ে ড্র্যাগ করে সেই অংশের ওপর একটি বক্স আঁকুন। এবং নিচের স্লাইডারগুলো দিয়ে ছবির উজ্জ্বলতা ও শার্পনেস সমন্বয় করুন।
            </DialogDescription>
          </DialogHeader>

          {/* Photo Adjustments Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 my-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl w-full">
            {/* Brightness */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>লাইট (Brightness)</span>
                <span className="font-mono text-indigo-500">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            {/* Contrast */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>কনট্রাস্ট (Contrast)</span>
                <span className="font-mono text-indigo-500">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            {/* Saturation / Color */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>কালার (Color)</span>
                <span className="font-mono text-indigo-500">{saturate > 0 ? `+${saturate}` : saturate}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={saturate}
                onChange={(e) => setSaturate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            {/* Sharpness */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>শার্পনেস (Sharpness)</span>
                <span className="font-mono text-indigo-500">{sharpness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => setSharpness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 my-4 overflow-hidden w-full">
            <div 
              ref={containerRef}
              className="relative select-none max-w-full overflow-hidden"
              style={{ cursor: isDrawing ? "crosshair" : "default" }}
            >
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[55vh] object-contain rounded-2xl shadow-md border border-slate-200 dark:border-slate-800"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDrawing(false)}
              />
              
              {/* Selection overlay box */}
              {isDrawing && (
                <div
                  className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none"
                  style={{
                    left: Math.min(startPos.x, currentPos.x),
                    top: Math.min(startPos.y, currentPos.y),
                    width: Math.abs(startPos.x - currentPos.x),
                    height: Math.abs(startPos.y - currentPos.y)
                  }}
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetBlur}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              disabled={blurringImage}
            >
              রিসেট (পুনরায় শুরু করুন)
            </Button>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowBlurDialog(false)}
                className="flex-1 sm:flex-initial h-12 px-6 rounded-2xl font-bold text-slate-500 dark:text-slate-400"
                disabled={blurringImage}
              >
                বাতিল
              </Button>
              <Button
                type="button"
                onClick={saveBlur}
                className="flex-1 sm:flex-initial h-12 px-8 rounded-2xl bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground font-black"
                disabled={blurringImage}
              >
                {blurringImage ? "সংরক্ষণ হচ্ছে..." : "ব্লার সেভ করুন"}
              </Button>
            </div>
          </DialogFooter>

          {/* Hidden SVG for sharpen filter placed inside the portal body to ensure DOM resolution and avoid layout collapse */}
          <svg style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, pointerEvents: "none", left: "-9999px", top: "-9999px" }}>
            <filter id="sharpen-filter" x="-10%" y="-10%" width="120%" height="120%">
              <feConvolveMatrix
                order="3"
                kernelMatrix={`0 -${(sharpness / 100) * 1.5} 0 -${(sharpness / 100) * 1.5} ${1 + 4 * ((sharpness / 100) * 1.5)} -${(sharpness / 100) * 1.5} 0 -${(sharpness / 100) * 1.5} 0`}
              />
            </filter>
          </svg>
        </DialogContent>
      </Dialog>
    </div>
  );
}
