"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// Define the photo type based on what we need from Unsplash API
interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
}

interface UnsplashImagePickerProps {
  onSelect: (photo: UnsplashPhoto) => void;
  buttonLabel?: string;
}

export function UnsplashImagePicker({ 
  onSelect, 
  buttonLabel = "Search Unsplash Images" 
}: UnsplashImagePickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);

  const searchPhotos = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/unsplash?action=search&query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search images");
      }
      
      const data = await response.json();
      setPhotos(data.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchPhotos();
    }
  };

  const handleSelectPhoto = async (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    
    // Track download as per Unsplash API guidelines
    try {
      await fetch(
        `/api/unsplash?action=trackDownload&downloadLocation=${encodeURIComponent(
          photo.links.download_location
        )}`
      );
    } catch (err) {
      console.error("Failed to track download:", err);
    }
    
    onSelect(photo);
    setIsOpen(false);
  };

  return (
    <div>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start"
      >
        {buttonLabel}
      </Button>
      
      {isOpen && (
        <Card className="mt-2 p-4 absolute z-50 bg-background border shadow-lg w-[90vw] max-w-3xl">
          <CardContent className="p-0 pb-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search for images..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={searchPhotos} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleSelectPhoto(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || "Unsplash image"}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate rounded-b-md">
                    Photo by{" "}
                    <a 
                      href={photo.user.links.html} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="underline"
                    >
                      {photo.user.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {photos.length === 0 && !loading && !error && (
              <p className="text-center text-muted-foreground mt-8">
                No images found. Try searching for something else.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 