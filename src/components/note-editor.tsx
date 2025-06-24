"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Remove FileUpload import and add UploadThing
import { R2FileUpload } from "@/components/r2-file-upload";
import { FileList } from "./file-list";
import { useNote } from "@/hooks/use-note";
import { Loader2, Save, Check, Copy, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NoteEditorProps {
  path: string;
}

export function NoteEditor({ path }: NoteEditorProps) {
  const { note, loading, saving, updateNote, refreshNote } = useNote(path);
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && content !== note.content) {
        updateNote(content)
          .then(() => {
            setLastSaved(new Date());
          })
          .catch(() => {
            toast.error("Failed to save note");
          });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, note, updateNote]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy URL");
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
      <div className="container mx-auto px-20 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex items-center gap-3">
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
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gradient">/{path}</h1>
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
                  ✨ Your changes are automatically saved
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

          {/* Files Section - Replace FileUpload with UploadThing */}
          <Card className="glass-effect border-border/50 card-hover border-[#2a2a5a] bg-[#12122a]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground flex items-center">
                📎 File Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <R2FileUpload
                notePath={path}
                onUploadComplete={refreshNote}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {note?.files && note.files.length > 0 && (
            <FileList files={note.files} onFileDeleted={refreshNote} />
          )}

          {/* Stats Section */}
          <Card className="glass-effect border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{content.length} characters</span>
                  <span>
                    {
                      content.split(/\s+/).filter((word) => word.length > 0)
                        .length
                    }{" "}
                    words
                  </span>
                  <span>{content.split("\n").length} lines</span>
                </div>
                <div>
                  {lastSaved
                    ? `Last saved: ${lastSaved.toLocaleString()}`
                    : "Not saved yet"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
