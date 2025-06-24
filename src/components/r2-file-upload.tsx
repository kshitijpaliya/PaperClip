"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface R2FileUploadProps {
  notePath: string;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export function R2FileUpload({
  notePath,
  onUploadComplete,
  disabled,
}: R2FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("notePath", notePath);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      const fileNames = result.files.map((file: any) => file.name).join(", ");
      toast.success(`Successfully uploaded: ${fileNames}`);
      setSelectedFiles([]);
      onUploadComplete?.();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 scale-105"
              : "border-border hover:border-blue-400"
          } ${
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            !disabled && !isUploading && fileInputRef.current?.click()
          }
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            )}
            <div className="text-sm">
              {isUploading ? (
                <span className="text-blue-500">Uploading...</span>
              ) : (
                <>
                  <span className="text-foreground font-medium">
                    Drop files here
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    or click to browse
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">Selected Files:</div>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={isUploading}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <Button
            onClick={uploadFiles}
            disabled={disabled || isUploading || selectedFiles.length === 0}
            className="mt-4 w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length} file(s)
              </>
            )}
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Maximum file sizes: Images/Text (4MB), Audio/PDF (8MB), Video (16MB) •
        Maximum 10 files per note
      </div>
    </div>
  );
}
