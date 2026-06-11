"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Play } from "lucide-react";
import Image from "next/image";

type Story = {
  id: number;
  mediaUrl: string;
  expiresAt: string;
  brandId: number;
  brandName: string;
  brandLogo: string | null;
};

export default function BrandStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStories(data);
        }
      })
      .catch((err) => console.error("Failed to load stories:", err));
  }, []);

  if (stories.length === 0) return null;

  return (
    <div className="w-full py-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-orange-500">
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative bg-muted">
                  {story.brandLogo ? (
                     <Image src={story.brandLogo} alt={story.brandName} fill className="object-cover" />
                  ) : (
                     <span className="flex items-center justify-center w-full h-full text-lg font-bold text-muted-foreground uppercase">
                       {story.brandName.substring(0, 2)}
                     </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors">
                {story.brandName}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!activeStory} onOpenChange={(open) => !open && setActiveStory(null)}>
        <DialogContent className="max-w-md p-0 border-none bg-black overflow-hidden h-[80vh] sm:h-[90vh]">
          {activeStory && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/20 bg-muted">
                   {activeStory.brandLogo ? (
                     <Image src={activeStory.brandLogo} alt={activeStory.brandName} fill className="object-cover" />
                   ) : (
                     <span className="flex items-center justify-center w-full h-full text-xs font-bold uppercase text-white bg-neutral-800">
                       {activeStory.brandName.substring(0, 2)}
                     </span>
                   )}
                </div>
                <span className="text-sm font-semibold text-white drop-shadow-md">
                  {activeStory.brandName}
                </span>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-4 right-4 z-50 p-2 text-white/80 hover:text-white bg-black/20 rounded-full backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Story Content */}
              {activeStory.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={activeStory.mediaUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
              ) : (
                <Image src={activeStory.mediaUrl} alt="Story" fill className="object-cover" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
