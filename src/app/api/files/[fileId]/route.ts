import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, generatePresignedUrl } from "@/lib/r2-client";
import { pusher } from "@/lib/pusher"; // Add this import

// GET: Download file by ID using presigned URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if file has expired
    if (fileRecord.expiresAt && fileRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    // Generate presigned URL (expires in 1 hour)
    const signedUrl = await generatePresignedUrl(fileRecord.filename, 3600);

    // Redirect to the presigned URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}

// DELETE: Delete file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Find the file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
      include: { note: true },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from R2 first
    try {
      await deleteFromR2(fileRecord.filename);
    } catch (r2Error) {
      console.warn("Failed to delete from R2:", r2Error);
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    // Add Pusher broadcast after successful deletion
    if (fileRecord.note) {
      await pusher.trigger(
        `presence-note-${fileRecord.note.path}`,
        "file-deleted",
        {
          fileId: fileId,
          fileName: fileRecord.originalName,
          timestamp: new Date().toISOString(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
