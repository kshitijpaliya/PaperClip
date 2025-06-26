import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, r2Client } from "@/lib/r2-client";
import { pusher } from "@/lib/pusher";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// GET: Download file by ID by streaming from R2
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

    // Get the file from R2 directly
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileRecord.filename,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "File content not found" },
        { status: 404 }
      );
    }

    // Convert the stream to ArrayBuffer
    const arrayBuffer = await response.Body.transformToByteArray();

    // Return the file with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": fileRecord.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileRecord.originalName}"`,
        "Content-Length": arrayBuffer.length.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
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

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from R2
    await deleteFromR2(fileRecord.filename);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    // Trigger real-time update
    await pusher.trigger(`note-${fileRecord.noteId}`, "file-deleted", {
      fileId: fileId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
