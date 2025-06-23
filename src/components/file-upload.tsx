// "use client";

// import type React from "react";
// import { useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Upload, FileIcon } from "lucide-react";
// import { toast } from "sonner";

// interface FileUploadProps {
//   onFileUpload: (file: File) => Promise<void>;
//   disabled?: boolean;
// }

// export function FileUpload({ onFileUpload, disabled }: FileUploadProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);

//   const handleFileSelect = async (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       await uploadFile(file);
//       // Reset the input
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   };

//   const uploadFile = async (file: File) => {
//     setIsUploading(true);
//     try {
//       await onFileUpload(file);
//       toast.success(`${file.name} uploaded successfully!`);
//     } catch (error) {
//       toast.error(`Failed to upload ${file.name}`);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleDrop = (event: React.DragEvent) => {
//     event.preventDefault();
//     setIsDragging(false);

//     const files = event.dataTransfer.files;
//     if (files.length > 0) {
//       uploadFile(files[0]);
//     }
//   };

//   const handleDragOver = (event: React.DragEvent) => {
//     event.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (event: React.DragEvent) => {
//     event.preventDefault();
//     setIsDragging(false);
//   };

//   return (
//     <div className="relative">
//       <input
//         ref={fileInputRef}
//         type="file"
//         onChange={handleFileSelect}
//         className="hidden"
//         disabled={disabled || isUploading}
//       />

//       {/* Drag and Drop Area */}
//       <div
//         className={`upload-area rounded-lg p-4 text-center transition-all duration-200 ${
//           isDragging
//             ? "border-blue-500 bg-blue-500/10 scale-105"
//             : "border-border hover:border-blue-400"
//         } ${
//           disabled || isUploading
//             ? "opacity-50 cursor-not-allowed"
//             : "cursor-pointer"
//         }`}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onClick={() =>
//           !disabled && !isUploading && fileInputRef.current?.click()
//         }
//       >
//         <div className="flex flex-col items-center gap-2">
//           {isUploading ? (
//             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//           ) : (
//             <FileIcon className="w-8 h-8 text-muted-foreground" />
//           )}
//           <div className="text-sm">
//             {isUploading ? (
//               <span className="text-blue-400">Uploading...</span>
//             ) : (
//               <>
//                 <span className="text-foreground font-medium">
//                   Drop files here
//                 </span>
//                 <span className="text-muted-foreground">
//                   {" "}
//                   or click to browse
//                 </span>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Quick Upload Button */}
//       <Button
//         onClick={() => fileInputRef.current?.click()}
//         disabled={disabled || isUploading}
//         variant="outline"
//         size="sm"
//         className="mt-2 w-full"
//       >
//         <Upload className="w-4 h-4 mr-2" />
//         {isUploading ? "Uploading..." : "Upload File"}
//       </Button>
//     </div>
//   );
// }
