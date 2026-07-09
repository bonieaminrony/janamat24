import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Video, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdMediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  requiredWidth: number;
  requiredHeight: number;
  placementLabel: string;
}

interface ValidationResult {
  isValid: boolean;
  actualWidth?: number;
  actualHeight?: number;
  message: string;
}

export function AdMediaUpload({ 
  value, 
  onChange, 
  requiredWidth, 
  requiredHeight,
  placementLabel 
}: AdMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateImageDimensions = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({
          isValid: true, // Always valid now
          actualWidth: img.width,
          actualHeight: img.height,
          message: `আপলোড করা ছবির সাইজ: ${img.width}×${img.height}px`
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({
          isValid: false,
          message: "ছবি যাচাই করতে সমস্যা হয়েছে"
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const validateVideoDimensions = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          isValid: true,
          actualWidth: video.videoWidth,
          actualHeight: video.videoHeight,
          message: `আপলোড করা ভিডিওর সাইজ: ${video.videoWidth}×${video.videoHeight}px`
        });
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          isValid: false,
          message: "ভিডিও যাচাই করতে সমস্যা হয়েছে"
        });
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - images and videos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast({
        title: "অনুমোদিত ফাইল নয়",
        description: "শুধুমাত্র JPG, PNG, WebP, GIF ছবি বা MP4, WebM ভিডিও আপলোড করতে পারবেন",
        variant: "destructive",
      });
      return;
    }

    // Validate file size - 5MB for images, 20MB for videos
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxSizeLabel = isVideo ? "২০ এমবি" : "৫ এমবি";
    
    if (file.size > maxSize) {
      toast({
        title: "ফাইল বড়",
        description: `সর্বোচ্চ ${maxSizeLabel} ফাইল আপলোড করতে পারবেন`,
        variant: "destructive",
      });
      return;
    }

    // Validate dimensions
    setUploading(true);
    setValidation(null);

    try {
      const validationResult = isImage 
        ? await validateImageDimensions(file)
        : await validateVideoDimensions(file);

      setValidation(validationResult);

      if (!validationResult.isValid) {
        toast({
          title: "ফাইল পড়তে সমস্যা",
          description: validationResult.message,
          variant: "destructive",
        });
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ad-images')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      
      toast({
        title: "সফল!",
        description: `${isVideo ? 'ভিডিও' : 'ছবি'} আপলোড হয়েছে`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "আপলোড ব্যর্থ",
        description: error instanceof Error ? error.message : "আপলোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange("");
    setValidation(null);
  };

  const isVideo = value && (value.endsWith('.mp4') || value.endsWith('.webm'));

  return (
    <div className="space-y-3">
      {/* Required Size Info */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-blue-800">সাজেস্টেড সাইজ (Recommended)</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600/70">প্রস্থ (Width):</span>
            <span className="ml-2 font-black text-blue-700">{requiredWidth}px</span>
          </div>
          <div>
            <span className="text-blue-600/70">উচ্চতা (Height):</span>
            <span className="ml-2 font-black text-blue-700">{requiredHeight}px</span>
          </div>
        </div>
        <p className="text-xs font-medium text-blue-600/60 mt-2">
          💡 এই সাইজের কাছাকাছি ছবি দিলে ওয়েবসাইটে সবচেয়ে সুন্দর দেখাবে। তবে যেকোনো সাইজ আপলোড করা যাবে।
        </p>
      </div>

      {/* Upload Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          uploading ? "border-slate-200 bg-slate-50" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
        )}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        <div className="flex justify-center gap-2 mb-2">
          <ImageIcon className="w-8 h-8 text-slate-400" />
          <Video className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-600 mb-1">
          {uploading ? "আপলোড হচ্ছে, দয়া করে অপেক্ষা করুন..." : "ক্লিক করে ছবি বা ভিডিও নির্বাচন করুন"}
        </p>
        <p className="text-xs text-slate-500">
          ছবি: JPG, PNG, WebP, GIF (সর্বোচ্চ ৫ এমবি)
        </p>
        <div className="mt-3 inline-block px-3 py-1 bg-blue-100 rounded-full">
          <span className="text-xs font-bold text-blue-700">
            বেস্ট রেজাল্ট: {requiredWidth}×{requiredHeight}px
          </span>
        </div>
      </div>

      {/* Validation Result */}
      {validation && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200 font-medium">
          <CheckCircle className="w-5 h-5" />
          <span>{validation.message}</span>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          {isVideo ? (
            <video
              src={value}
              className="max-w-full h-32 object-cover rounded-lg border border-divider"
              controls
              muted
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="max-w-full h-32 object-cover rounded-lg border border-divider"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleClear}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
