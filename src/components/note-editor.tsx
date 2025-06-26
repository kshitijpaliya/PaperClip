"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { R2FileUpload } from "@/components/r2-file-upload";
import { FileList } from "./file-list";
import {
  Loader2,
  Save,
  Check,
  Copy,
  ArrowLeft,
  Paperclip,
  // Wifi,
  // WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Add the Note type definition with proper file structure
interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface Note {
  content: string;
  path: string;
  updatedAt: string;
  files?: FileItem[]; // Changed from File[] to FileItem[]
}

interface NoteEditorProps {
  path: string;
  note: Note | null;
  loading: boolean;
  saving: boolean;
  broadcastUpdate: (content: string) => void;
  saveToDatabase: (content: string) => Promise<void>;
  refreshNote: () => Promise<void>; // Add this
}

export function NoteEditor({
  path,
  note,
  loading,
  saving,
  broadcastUpdate,
  saveToDatabase,
  refreshNote,
}: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [lastBroadcastedContent, setLastBroadcastedContent] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastBroadcast, setLastBroadcast] = useState<Date | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Initialize content from note
  useEffect(() => {
    if (note) {
      setContent((prev) => {
        if (prev !== note.content) {
          setLastSavedContent(note.content);
          setLastBroadcastedContent(note.content);
          return note.content;
        }
        return prev;
      });
    }
  }, [note]);

  // Broadcast (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== lastBroadcastedContent && content.trim() !== "") {
        broadcastUpdate(content);
        setLastBroadcast(new Date());
        setLastBroadcastedContent(content);
        console.log("Broadcasted to other users");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, lastBroadcastedContent, broadcastUpdate]);

  // Auto-save to DB (3s delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== lastSavedContent && content.trim() !== "") {
        saveToDatabase(content)
          .then(() => {
            setLastSaved(new Date());
            setLastSavedContent(content);
            console.log("✅ Saved to database");
          })
          .catch((error) => {
            console.error("❌ Save failed:", error);
            toast.error("Failed To Save Note");
          });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, lastSavedContent, saveToDatabase]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("URL Copied To Clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed To Copy URL");
    }
  };

  // Update the file operation handler
  const handleFileOperation = async () => {
    console.log("File operation completed, refreshing note...");
    try {
      await refreshNote();
      console.log("Note refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh note:", error);
      toast.error("Failed to refresh file list");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your note...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5">
      <div className="container mx-auto px-4 sm:px-8 md:px-12 lg:px-20 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-muted-foreground border hover:border-blue-950 hover:bg-blue-850/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={copyUrl}
                className="hover:border-blue-950 hover:bg-blue-850/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between">
            <h1 className="text-2xl font-bold text-gradient">/{path}</h1>
            <div className="flex items-center gap-2">
              {/* Real-time broadcast status */}
              {/* {lastBroadcast && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Wifi className="w-3 h-3 mr-1" />
                  Synced {lastBroadcast.toLocaleTimeString()}
                </Badge>
              )} */}

              {/* Database save status */}
              {saving && (
                <Badge className="status-saving animate-pulse">
                  <Save className="w-3 h-3 mr-1" />
                  Saving...
                </Badge>
              )}
              {lastSaved && !saving && (
                <Badge className="status-saved">
                  <Check className="w-3 h-3 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-6 animate-slide-up">
          <Card className="card-hover glass-effect border-border/50 hover:shadow-lg transition-all border-[#2a2a5a] bg-[#12122a]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">
                Note Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="editor-area border-0 rounded-none">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing your note... 
                  ✨ Changes sync in real-time (300ms)
                  💾 Auto-saved every 3 seconds
                  📎 Use the upload button to attach files  
                  🔗 Share this URL with others to collaborate"
                  className="min-h-[500px] resize-none border-0 bg-transparent p-6 text-base leading-relaxed focus-visible:ring-0 focus-visible:border-0 focus:border-0 focus:outline-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70"
                  style={{
                    fontFamily:
                      'var(--font-geist-mono), Consolas, Monaco, "Courier New", monospace',
                    lineHeight: "1.6",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Files Section */}
          <Card className=" glass-effect border border-blue-950 backdrop-blur-sm transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-lg font-medium text-foreground">
                  File Attachments
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <R2FileUpload
                notePath={path}
                onUploadComplete={handleFileOperation}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {note?.files && note.files.length > 0 && (
            <FileList
              files={note.files.map((file) => ({
                ...file,
                createdAt: new Date().toISOString(), // Convert Date to string
              }))}
              onFileDeleted={handleFileOperation}
            />
          )}
          {/* Stats Section */}
          <Card className="glass-effect border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{content.length} Characters</span>
                  <span>
                    {
                      content.split(/\s+/).filter((word) => word.length > 0)
                        .length
                    }{" "}
                    Words
                  </span>
                  <span>{content.split("\n").length} Lines</span>
                </div>
                <div className="flex items-center gap-4">
                  {lastBroadcast && (
                    <span className="text-blue-500">
                      Last sync: {lastBroadcast.toLocaleTimeString()}
                    </span>
                  )}
                  {lastSaved ? (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  ) : (
                    <span>Not saved yet</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
