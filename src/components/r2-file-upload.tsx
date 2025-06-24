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
    // Append new files to existing selection instead of replacing
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    // Append new files to existing selection instead of replacing
    setSelectedFiles((prev) => [...prev, ...files]);
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

      interface UploadedFile {
        name: string;
        [key: string]: unknown;
      }
      const fileNames = (result.files as UploadedFile[])
        .map((file) => file.name)
        .join(", ");
      toast.success(`Successfully uploaded: ${fileNames}`);
      setSelectedFiles([]);
      onUploadComplete?.();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Upload Error:", error);
      let message = "Upload failed";
      if (error instanceof Error) {
        message = `Upload failed: ${error.message}`;
      }
      toast.error(message);
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

  const getFileIconColor = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];
    const audioExtensions = ["mp3", "wav", "ogg", "m4a"];
    const pdfExtensions = ["pdf"];
    const textExtensions = ["txt", "md", "json", "csv"];

    if (imageExtensions.includes(extension || "")) return "text-blue-500";
    if (videoExtensions.includes(extension || "")) return "text-purple-500";
    if (audioExtensions.includes(extension || "")) return "text-green-500";
    if (pdfExtensions.includes(extension || "")) return "text-red-500";
    if (textExtensions.includes(extension || "")) return "text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <div className="mx-auto px-4">
      <div className="text-sm text-muted-foreground mb-3 text-center">
        Supports Images, Videos, Audio, PDFs, Code Files
      </div>

      <div className="flex flex-col items-center">
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Uploading {selectedFiles.length} file(s)...
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
          className={`w-full max-w-md border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
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
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            ) : (
              <div className="relative">
                <FileIcon className="w-10 h-10 text-muted-foreground" />
                <Upload className="w-5 h-5 absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 text-blue-500 border border-blue-500" />
              </div>
            )}
            <div className="text-sm">
              {isUploading ? (
                <span className="text-blue-500">Upload in progress...</span>
              ) : (
                <>
                  <span className="text-foreground font-medium">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : "Select files to upload"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 w-full">
            <div className="text-sm font-medium mb-2 text-center">
              Ready to upload
            </div>
            <div className="flex justify-center">
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-[200px]"
                  >
                    <FileIcon
                      className={`w-4 h-4 flex-shrink-0 ${getFileIconColor(
                        file.name
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
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
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 mt-4 w-full max-w-md">
            <Button
              variant="outline"
              onClick={() => setSelectedFiles([])}
              disabled={disabled || isUploading}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={disabled || isUploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Now
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-3 text-center">
        Max 10 files • Max File Size 5MB
      </div>
    </div>
  );
}
