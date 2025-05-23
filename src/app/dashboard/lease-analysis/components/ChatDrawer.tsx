"use client";

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useChat } from '@ai-sdk/react'; // Import useChat hook
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, AlertCircle, Loader2, Send } from 'lucide-react';
// OpenAI import is no longer needed as useChat handles message types

// ChatMessage interface is no longer needed, useChat provides message structure

interface ChatDrawerProps {
  analysisId: string;
  analysisFileName?: string; // Optional, for display
  triggerButton?: React.ReactNode; // Allow custom trigger
}

export function ChatDrawer({ analysisId, analysisFileName, triggerButton }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,    // Messages from the chat hook
    input,       // Current input value
    handleInputChange, // Handler for input changes
    handleSubmit,  // Handler for form submission
    isLoading,   // Loading state from the hook
    error,       // Error state from the hook
    // setMessages, // If you need to manually manipulate messages
    // reload,      // To resend the last user message
    // stop,        // To stop the current stream
  } = useChat({
    api: '/api/chat', // Endpoint for the chat API
    body: { // Additional data to send with each request
      analysisId: analysisId,
    },
    initialMessages: [], // Optionally, set initial messages
    onFinish: () => {
      // Optional: Any action to take when a response is fully received
      scrollToBottom();
      // Re-focus the input after message is sent and response received
      document.getElementById('chat-input')?.focus(); 
    },
    onError: (err) => {
        // Optional: Custom error handling
        console.error("Chat hook error:", err);
        // The error state from useChat will be populated, which we display
    }
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      // The viewport might be nested differently or not exist until ScrollArea fully renders.
      // It is safer to scroll the main scrollAreaRef itself, or ensure the querySelector is robust.
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else {
        // Fallback if the viewport isn't found (e.g., if ScrollArea structure changes)
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added or when isLoading changes (e.g., assistant starts typing)
    scrollToBottom();
  }, [messages, isLoading]);

  // Custom handleSubmit to potentially add more logic if needed, 
  // or directly use `handleSubmit` from `useChat` in the form.
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e); // Call the useChat handleSubmit
    // `input` will be cleared automatically by `useChat`
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {triggerButton ? triggerButton : <Button variant="outline">Ask AI Assistant</Button>}
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] flex flex-col">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>Chat with AI Assistant</DrawerTitle>
          <DrawerDescription>
            Ask questions about your lease analysis: {analysisFileName || analysisId}.
            This AI provides information, not legal advice.
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id} // useChat provides unique IDs
                className={`flex items-start space-x-3 ${ 
                  message.role === 'user' ? 'justify-end' : '' 
                }`}
              >
                {message.role === 'assistant' && (
                  <span className="flex-shrink-0 p-2 bg-primary/10 text-primary rounded-full">
                    <Bot className="h-5 w-5" />
                  </span>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[75%] whitespace-pre-wrap ${ 
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground self-end' 
                      : 'bg-muted' 
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <span className="flex-shrink-0 p-2 bg-blue-100 text-blue-700 rounded-full">
                    <User className="h-5 w-5" />
                  </span>
                )}
              </div>
            ))}
            {/* isLoading state from useChat handles loading indication for assistant responses */} 
            {isLoading && messages[messages.length -1]?.role === 'user' && (
                // Show loader only when waiting for assistant, not while user is typing but before sending
                <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 p-2 bg-primary/10 text-primary rounded-full">
                        <Bot className="h-5 w-5 animate-pulse" />
                    </span>
                    <div className="p-3 rounded-lg bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
            {/* error state from useChat can be used to display errors */} 
            {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/30 rounded-md">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">Error: {error.message || "An unknown error occurred."}</p>
                </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4">
          {/* Use handleFormSubmit which wraps useChat's handleSubmit */} 
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
            <Input
              id="chat-input"
              value={input} // Controlled by useChat
              onChange={handleInputChange} // Handled by useChat
              placeholder="Ask about your lease..."
              className="flex-grow"
              disabled={isLoading} // Disable input when loading a response
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {/* Show loader in button if actively waiting for AI response */} 
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          <DrawerClose asChild>
            <Button variant="outline" className="mt-2 w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 