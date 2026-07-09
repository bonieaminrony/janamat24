import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Check, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AvatarUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarUpload({ value, onChange, bucket = "profile-avatars" }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "অনুমোদিত ফাইল নয়",
        description: "শুধুমাত্র JPG, PNG, WebP ফাইল আপলোড করতে পারবেন",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ফাইল বড়",
        description: "সর্বোচ্চ ৫ এমবি ফাইল আপলোড করতে পারবেন",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || "");
      setCropDialogOpen(true);
    });
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to desired output (300x300 for avatar)
    const outputSize = 300;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop) {
      toast({
        title: "ক্রপ করুন",
        description: "ছবিতে একটি এলাকা নির্বাচন করুন",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) throw new Error("Failed to crop image");

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      setCropDialogOpen(false);
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);

      toast({
        title: "সফল!",
        description: "ছবি আপলোড হয়েছে",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "আপলোড ব্যর্থ",
        description: error instanceof Error ? error.message : "ছবি আপলোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const handleCancel = () => {
    setCropDialogOpen(false);
    setImageSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelectFile}
        className="hidden"
      />

      {/* Drag & Drop Zone with Avatar Preview */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative p-4 rounded-xl border-2 border-dashed transition-all duration-200
          ${isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-divider hover:border-accent/50 bg-muted/10"
          }
        `}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl z-10">
            <div className="text-center">
              <Upload className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-medium text-primary">ছবি এখানে ছাড়ুন</p>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-4 ${isDragging ? "opacity-30" : ""}`}>
          <div className="relative">
            {value ? (
              <div className="relative group">
                <img
                  src={value}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-divider"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-red-500/50"
                    onClick={handleClear}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-full border-2 border-dashed border-divider flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors bg-muted/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-subtext" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {value ? "ছবি পরিবর্তন করুন" : "ছবি নির্বাচন করুন"}
            </Button>
            <p className="text-xs text-subtext mt-2">
              <span className="font-medium">ড্র্যাগ করে ছাড়ুন</span> অথবা ক্লিক করুন
            </p>
            <p className="text-xs text-subtext">
              JPG, PNG, WebP • সর্বোচ্চ ৫ এমবি
            </p>
          </div>
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ছবি ক্রপ করুন</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-subtext text-center">
              প্রোফাইল ছবির জন্য বর্গাকার এলাকা নির্বাচন করুন
            </p>
            
            {imageSrc && (
              <div className="max-h-[400px] overflow-auto rounded-lg border border-divider">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            )}

            {/* Preview of cropped result */}
            {completedCrop && (
              <div className="text-center">
                <p className="text-xs text-subtext mb-2">প্রিভিউ (বৃত্তাকার)</p>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary mx-auto bg-muted">
                  {/* Visual indicator only */}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              বাতিল
            </Button>
            <Button
              type="button"
              onClick={handleCropComplete}
              disabled={uploading || !completedCrop}
              className="gap-2"
            >
              {uploading ? (
                "আপলোড হচ্ছে..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  সংরক্ষণ করুন
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
