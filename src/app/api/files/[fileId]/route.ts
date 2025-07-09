import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2-client";
import { pusher } from "@/lib/pusher";

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
