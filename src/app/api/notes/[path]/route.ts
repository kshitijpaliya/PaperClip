import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Get note by path
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path } = await params;

    if (!path || path.trim() === "") {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { path },
      include: {
        files: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!note) {
      return NextResponse.json({
        content: "",
        files: [],
        path: path,
      });
    }

    return NextResponse.json({
      content: note.content,
      files: note.files,
      path: note.path,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PUT: Update note by path
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const { path } = await params;
    const { content } = await request.json();

    console.log("Incoming PUT request");
    console.log("Path:", path);
    console.log("Content:", content);

    if (!path || path.trim() === "") {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    const note = await prisma.note.upsert({
      where: { path },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        path,
        content,
        updatedAt: new Date(),
      },
      include: {
        files: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      content: note.content,
      files: note.files,
      path: note.path,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}
