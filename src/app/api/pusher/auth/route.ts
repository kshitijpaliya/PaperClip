import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");
    const userId = req.headers.get("X-User-ID");

    if (!socketId || !channelName || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // For presence channels, provide user info
    const presenceData = {
      user_id: userId,
      user_info: {
        id: userId,
        name: `User ${userId.slice(-4)}`, // Show last 4 characters
      },
    };

    const authResponse = pusher.authorizeChannel(
      socketId,
      channelName,
      presenceData
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
