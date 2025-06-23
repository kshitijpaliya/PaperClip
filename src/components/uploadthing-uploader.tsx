"use client";

import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface UploadThingUploaderProps {
  notePath: string;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export function UploadThingUploader({
  notePath,
  onUploadComplete,
  disabled,
}: UploadThingUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Upload files to attach them to this note. Supported formats: images,
        videos, audio, PDFs, and text files.
      </div>

      <div className="relative">
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          </div>
        )}

        <UploadButton
          endpoint="fileUploader"
          onClientUploadComplete={(res) => {
            setIsUploading(false);
            if (res && res.length > 0) {
              const fileNames = res.map((file) => file.name).join(", ");
              toast.success(`Successfully uploaded: ${fileNames}`);
              onUploadComplete?.();
            }
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false);
            console.error("Upload error:", error);
            toast.error(`Upload failed: ${error.message}`);
          }}
          onUploadBegin={(name) => {
            setIsUploading(true);
            toast.info(`Starting upload: ${name}`);
          }}
          headers={{
            "x-note-path": notePath,
          }}
          config={{
            mode: "manual",
          }}
          appearance={{
            button: `
              bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg
              transition-colors duration-200 ease-in-out
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `,
            allowedContent: "text-gray-400 text-sm",
            container: "w-full",
          }}
          disabled={disabled || isUploading}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Maximum file sizes: 2MB & Maximum number of files: 5
      </div>
    </div>
  );
}
