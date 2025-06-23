import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// GET: Download file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileRecord = await prisma.file.findUnique({
      where: { id: params.fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Redirect to UploadThing URL for download
    return NextResponse.redirect(fileRecord.url);
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

// DELETE: Delete file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Find the file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
      include: { note: true }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from UploadThing first
    try {
      await utapi.deleteFiles([fileRecord.filename]);
    } catch (utError) {
      console.warn("Failed to delete from UploadThing:", utError);
      // Continue with database deletion even if UploadThing deletion fails
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "File deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ 
      error: "Failed to delete file" 
    }, { status: 500 });
  }
}