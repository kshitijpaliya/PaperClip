import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { channel, event, data } = await req.json();

    if (!channel || !event || !data) {
      return NextResponse.json(
        { error: "Missing required fields: channel, event, data" },
        { status: 400 }
      );
    }

    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher broadcast error:", error);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}
