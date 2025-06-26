import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedUrl, uploadToR2 } from "@/lib/r2-client";
import { generateUniqueFilename } from "@/lib/file-utils";
import { pusher } from "@/lib/pusher";

// Rate limiting store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 300000
) => {
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

const getClientIP = (req: NextRequest) => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
};

const MAX_FILE_SIZES: { [key: string]: number } = {
  image: 5 * 1024 * 1024, // 5MB
  video: 5 * 1024 * 1024, // 5MB
  audio: 5 * 1024 * 1024, // 5MB
  "application/pdf": 5 * 1024 * 1024, // 5MB
  text: 5 * 1024 * 1024, // 5MB
  default: 5 * 1024 * 1024, // 5MB
};

export async function POST(req: NextRequest) {
  console.log("=== UPLOAD REQUEST START ===");

  try {
    const ip = getClientIP(req);

    // Rate limiting check
    if (!rateLimit(ip, 10, 300000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in 5 minutes." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const notePath = formData.get("notePath") as string;

    if (!notePath || notePath.trim() === "") {
      return NextResponse.json(
        { error: "Note path is required" },
        { status: 400 }
      );
    }

    // Validate note path format
    if (!/^[a-zA-Z0-9_-]+$/.test(notePath)) {
      return NextResponse.json(
        { error: "Invalid note path format" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Find or create note
    let note = await prisma.note.findUnique({
      where: { path: notePath },
      include: { files: true },
    });

    if (!note) {
      note = await prisma.note.create({
        data: {
          path: notePath,
          content: "",
        },
        include: { files: true },
      });
    }

    // Check file count limit per note
    if (note.files.length + files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 Files Allowed Per Note" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      console.log(
        `Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`
      );

      // Validate file size
      const fileType = file.type.split("/")[0];
      const maxSize =
        MAX_FILE_SIZES[fileType] ||
        MAX_FILE_SIZES[file.type] ||
        MAX_FILE_SIZES.default;

      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `File ${
              file.name
            } exceeds maximum size limit of ${Math.round(
              maxSize / 1024 / 1024
            )}MB`,
          },
          { status: 400 }
        );
      }

      // Generate unique filename
      const uniqueFilename = generateUniqueFilename(file.name);
      // console.log(`Generated unique filename: ${uniqueFilename}`);

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      // console.log(`Buffer created, size: ${buffer.length}`);

      // Upload to R2 (returns key, not URL)
      console.log("Starting R2 upload...");
      const fileKey = await uploadToR2(buffer, uniqueFilename, file.type);
      console.log("R2 upload completed --> Key:", fileKey);

      // Store in database with key instead of URL
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const fileRecord = await prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          url: fileKey, // Store the key, not the URL
          noteId: note.id,
          uploadedAt: new Date(),
          expiresAt: expiresAt,
        },
      });

      const signedUrl = await generatePresignedUrl(fileKey, 3600); // 1 hour valid

      uploadedFiles.push({
        id: fileRecord.id,
        name: file.name,
        url: signedUrl, // NEW: direct, time-limited access
        size: file.size,
        type: file.type,
      });
    }

    // After successful upload, broadcast to other users
    if (uploadedFiles.length > 0) {
      await pusher.trigger(`presence-note-${notePath}`, "file-uploaded", {
        files: uploadedFiles,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    });
  } catch (error) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error details:", error);
    if (typeof error === "object" && error !== null && "message" in error) {
      console.error("Error message:", (error as { message?: string }).message);
    }
    if (typeof error === "object" && error !== null && "stack" in error) {
      console.error("Error stack:", (error as { stack?: string }).stack);
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
