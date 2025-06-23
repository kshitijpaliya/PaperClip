import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

// Enhanced rate limiting store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (ip: string, maxRequests: number = 10, windowMs: number = 300000) => {
  const now = Date.now();
  const key = `upload_${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

const getClientIP = async (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const clientIP = forwarded?.split(",")[0]?.trim() || realIP || "unknown";
  return clientIP;
};

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 3 },
    audio: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 10 },
    blob: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      try {
        const ip = await getClientIP(req);
        
        // Rate limiting check
        if (!rateLimit(ip, 10, 300000)) {
          throw new UploadThingError("Rate limit exceeded. Please try again in 5 minutes.");
        }

        const notePath = req.headers.get("x-note-path");
        
        if (!notePath || notePath.trim() === "") {
          throw new UploadThingError("Note path is required");
        }

        // Validate note path format
        if (!/^[a-zA-Z0-9_-]+$/.test(notePath)) {
          throw new UploadThingError("Invalid note path format");
        }

        let note = await prisma.note.findUnique({
          where: { path: notePath },
          include: { files: true }
        });

        if (!note) {
          note = await prisma.note.create({
            data: {
              path: notePath,
              content: "",
            },
            include: { files: true }
          });
        }

        // Check file count limit per note
        if (note.files.length >= 10) {
          throw new UploadThingError("Maximum 10 files allowed per note");
        }

        return { 
          noteId: note.id, 
          notePath: notePath,
          uploaderIP: ip 
        };
      } catch (error) {
        console.error("Middleware error:", error);
        if (error instanceof UploadThingError) {
          throw error;
        }
        throw new UploadThingError("Upload preparation failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const fileRecord = await prisma.file.create({
          data: {
            filename: file.key,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            url: file.url,
            noteId: metadata.noteId,
            uploadedAt: new Date(),
            expiresAt: expiresAt,
          },
        });

        console.log("File uploaded successfully:", {
          fileId: fileRecord.id,
          fileName: file.name,
          noteId: metadata.noteId,
          url: file.url
        });

        return { 
          fileId: fileRecord.id,
          success: true,
          message: "File uploaded successfully",
          url: file.url
        };
      } catch (error) {
        console.error("Error storing file in database:", error);
        throw new UploadThingError("Failed to store file information");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
