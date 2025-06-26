"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Image,
  FileIcon,
  Video,
  Music,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface FileListProps {
  files: File[]; // Change from FileItem[]
  onFileDeleted: (file: File) => void;
}

export function FileList({ files, onFileDeleted }: FileListProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("text") || mimeType.includes("document"))
      return FileText;
    return FileIcon;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return "bg-green-500/10 text-green-400 border-green-500/20";
    if (mimeType.startsWith("video/"))
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (mimeType.startsWith("audio/"))
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (mimeType.includes("text") || mimeType.includes("document"))
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadFile = async (file: File) => {
    try {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.originalName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${file.originalName}`);
    } catch {
      toast.error(`Failed To Download ${file.originalName}`);
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    setDeletingFiles((prev) => new Set(prev).add(fileId));

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`${fileName} Deleted Successfully`);
        onFileDeleted?.();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed To Delete File");
      }
    } catch {
      toast.error(`Failed To Delete ${fileName}`);
    } finally {
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <Card className="glass-effect border border-blue-950">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center text-foreground">
            <FileText className="w-5 h-5 mr-2" />
            Attached Files
          </CardTitle>
          <Badge variant="secondary" className="bg-muted/50">
            {files.length} {files.length === 1 ? "file" : "files"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            const colorClass = getFileTypeColor(file.mimeType);
            const isDeleting = deletingFiles.has(file.id);

            return (
              <div
                key={file.id}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:bg-muted/30 ${colorClass} ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">
                        {file.originalName}
                      </p>
                      <span className="text-xs px-2 py-1 rounded border opacity-70">
                        {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(file)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/10 hover:text-blue-400"
                  >
                    <Download className="w-4 h-4" />
                    <span className="sr-only">
                      Download {file.originalName}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFile(file.id, file.originalName)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="sr-only">Delete {file.originalName}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
