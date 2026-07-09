import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

export function ImageUpload({ value, onChange, bucket = "news-images" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 h-auto grid grid-cols-2">
          <TabsTrigger value="upload" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Upload className="w-4 h-4 shadow-sm" /> আপলোড
          </TabsTrigger>
          <TabsTrigger value="url" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LinkIcon className="w-4 h-4 shadow-sm" /> URL লিংক
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <div 
            className={cn(
              "group relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer overflow-hidden",
              isDragOver ? "border-slate-900 bg-slate-50 scale-[0.98]" : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50",
              uploading && "opacity-50 pointer-events-none"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            
            <div className="relative z-10 space-y-4">
               <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {uploading ? <Sparkles className="w-10 h-10 text-slate-900 animate-pulse" /> : <ImageIcon className="w-10 h-10 text-slate-400" />}
               </div>
               <div>
                  <p className="text-xl font-black text-slate-900 tracking-tight">
                    {uploading ? "আপলোড হচ্ছে..." : "ছবিটি এখানে টেনে আনুন"}
                  </p>
                  {!uploading && (
                    <p className="text-sm font-bold text-primary mt-1">
                      অথবা ব্রাউজ করতে ক্লিক করুন
                    </p>
                  )}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
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
              className="h-14 rounded-2xl bg-white border-slate-200 px-6 font-bold"
            />
            <Button type="button" onClick={() => onChange(urlInput)} className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black">
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
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-6 right-6 h-12 w-12 rounded-2xl shadow-2xl opacity-0 group-hover/preview:opacity-100 transition-opacity active:scale-95"
            onClick={() => { onChange(""); setUrlInput(""); }}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
