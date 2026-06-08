import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Camera, Monitor, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void;
  disabled: boolean;
  isBusy?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, disabled, isBusy, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleSend = useCallback(() => {
    if (!input.trim() && images.length === 0) return;
    onSend(input.trim(), images.length > 0 ? images : undefined);
    setInput("");
    setImages([]);
  }, [input, images, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const compressImage = (source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, maxWidth = 800, quality = 0.7): string => {
    const canvas = document.createElement("canvas");
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source instanceof HTMLCanvasElement ? source.width : source.width;
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source instanceof HTMLCanvasElement ? source.height : source.height;
    let w = sw, h = sh;
    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  };

  const compressFile = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const result = compressImage(img, maxWidth, quality);
        result ? resolve(result) : reject("No canvas context");
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject("Failed to load image"); };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const compressed = await compressFile(file);
        setImages(prev => [...prev, compressed]);
      } catch (err) {
        console.error("Image compression failed:", err);
      }
    }
    e.target.value = "";
  };

  const handleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } as any });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      // Small delay to ensure frame is ready
      await new Promise(r => setTimeout(r, 100));
      const result = compressImage(video, 800, 0.7);
      track.stop();
      if (result) {
        setImages(prev => [...prev, result]);
        toast.success("Screenshot captured!");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Screen capture cancelled or not supported");
      }
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="shrink-0 border-t border-border/30 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4 bg-card/60 backdrop-blur-xl saturate-150 transition-all duration-300">
      <div className="max-w-3xl mx-auto">
        {images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex min-w-0 items-end gap-1.5 md:gap-2">
          {/* File upload input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Camera input for mobile */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* File attach button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="h-9 w-9 md:h-10 md:w-10 shrink-0"
            title="Upload image"
          >
            <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          {/* Camera (mobile) or Screenshot (desktop) */}
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => cameraRef.current?.click()}
              disabled={disabled}
              className="h-9 w-9 md:h-10 md:w-10 shrink-0"
              title="Take photo"
            >
              <Camera className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleScreenCapture}
              disabled={disabled}
              className="h-9 w-9 md:h-10 md:w-10 shrink-0"
              title="Take screenshot"
            >
              <Monitor className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message PANDA AI…"
            disabled={disabled}
            className="min-h-[44px] max-h-[38dvh] min-w-0 resize-none bg-background/50 text-sm"
            rows={1}
          />
          <Button
            onClick={isBusy ? onStop : handleSend}
            disabled={isBusy ? false : disabled || (!input.trim() && images.length === 0)}
            size="icon"
            className="h-9 w-9 md:h-10 md:w-10 shrink-0"
            title={isBusy ? "Stop response" : "Send message"}
          >
            {isBusy ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
