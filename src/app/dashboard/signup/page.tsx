"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { UnsplashImagePicker } from "@/components/ui/unsplash-image-picker";

// Interface for Unsplash photo
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
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // In a real app, this would call an API to create the account
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }, 1500);
  };

  const handlePhotoSelect = (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    console.log("Selected photo:", photo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create a TenantArmor account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Selection */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex flex-col space-y-2">
                <UnsplashImagePicker 
                  onSelect={handlePhotoSelect} 
                  buttonLabel="Select a profile picture"
                />
                
                {selectedPhoto && (
                  <div className="mt-2 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedPhoto.urls.small} 
                      alt={selectedPhoto.alt_description || "Selected profile picture"} 
                      className="w-full h-40 object-cover rounded-md" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md">
                      Photo by{" "}
                      <a 
                        href={selectedPhoto.user.links.html} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline"
                      >
                        {selectedPhoto.user.name}
                      </a> on{" "}
                      <a 
                        href="https://unsplash.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline"
                      >
                        Unsplash
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a secure password" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="Confirm your password" 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/dashboard/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 