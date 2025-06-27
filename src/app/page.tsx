"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import {
  FileText,
  Upload,
  Zap,
  Share2,
  Lock,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { TurnstileCaptcha } from "@/components/turnstile-captcha";
import { toast } from "sonner";

export default function Home() {
  const [path, setPath] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;

    // Show CAPTCHA first
    if (!captchaToken) {
      setShowCaptcha(true);
      return;
    }

    // Verify CAPTCHA and proceed
    await verifyAndProceed(path.trim(), captchaToken);
  };

  const handleRandomNote = async () => {
    // Show CAPTCHA first
    if (!captchaToken) {
      setShowCaptcha(true);
      return;
    }

    const randomPath = Math.random().toString(36).substring(2, 8);
    await verifyAndProceed(randomPath, captchaToken);
  };

  const verifyAndProceed = async (notePath: string, token: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "access_note" }),
      });

      if (response.ok) {
        router.push(`/note/${notePath}`);
      } else {
        toast.error("CAPTCHA verification failed. Please try again.");
        setCaptchaToken("");
        setShowCaptcha(false);
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      setCaptchaToken("");
      setShowCaptcha(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    toast.success("CAPTCHA verified successfully!");
  };

  const handleCaptchaError = () => {
    toast.error("CAPTCHA verification failed. Please try again.");
    setCaptchaToken("");
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-0 pb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8 inline-flex items-center rounded-full border border-border/50 glass-effect px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="mr-2 h-4 w-4 text-blue-400" />
              <span className="text-foreground">
                Simple, fast, and collaborative
              </span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-8">
              <span className="text-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                PaperClip:
              </span>
              <span className="text-foreground"> Notes & Files</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
              Create and share notes instantly with unique URLs. Upload files,
              collaborate in real-time, and never lose your work with auto-save.
            </p>

            {/* URL Input Card */}
            <Card className="max-w-2xl mx-auto mb-16 glass-effect border-border/50 card-hover animate-glow">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl text-foreground">
                  Create or Access a Note
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter a unique name for your note. Anyone with the link can
                  access it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center rounded-lg border border-input bg-background/50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                    <span className="flex items-center px-4 py-3 bg-muted/30 text-sm text-muted-foreground border-r border-border">
                      paperclip/
                    </span>
                    <Input
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      placeholder="my-awesome-note"
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/70"
                    />
                  </div>

                  {showCaptcha && !captchaToken && (
                    <div className="border border-border/50 rounded-lg p-4 bg-muted/10">
                      <p className="text-sm text-muted-foreground mb-3 text-center">
                        Please complete the security verification
                      </p>
                      <TurnstileCaptcha
                        onVerify={handleCaptchaVerify}
                        onError={handleCaptchaError}
                        onExpire={() => setCaptchaToken("")}
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1 h-12 btn-primary"
                      disabled={!path.trim()}
                    >
                      Open Note
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRandomNote}
                      className="h-12 border-border/50 hover:border-blue-500/50 hover:bg-blue-500/10"
                    >
                      Random
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-foreground">
              Everything you need for notes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for simplicity and speed, with all the features you need for
              effective note-taking and file sharing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                  <FileText className="w-7 h-7 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Instant Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Create notes instantly with unique URLs. No signup required -
                  just start typing and share the link.
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                  <Upload className="w-7 h-7 text-green-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  File Sharing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Upload and share files alongside your notes. Images,
                  documents, code - share anything instantly.
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                  <Zap className="w-7 h-7 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Auto-Save
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Your changes are automatically saved as you type. Never lose
                  your work again.
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                  <Share2 className="w-7 h-7 text-orange-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Easy Sharing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Share your notes with a simple link. Perfect for
                  collaboration, code sharing, or quick notes.
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                  <Lock className="w-7 h-7 text-red-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Privacy First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Your notes are only accessible via the unique URL. No
                  indexing, no tracking, just simple privacy.
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-border/50 card-hover glass-effect animate-slide-up"
              style={{ animationDelay: "0.5s" }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <Globe className="w-7 h-7 text-teal-400" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Always Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Access your notes from anywhere, anytime. Works on all devices
                  with a modern web browser.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-foreground">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Create your first note in seconds. No registration required.
          </p>
          <Button
            size="lg"
            onClick={handleRandomNote}
            className="h-14 px-8 text-base btn-primary"
          >
            Create Random Note
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-r sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-foreground">
                PaperClip
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Built by Kshitij ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
