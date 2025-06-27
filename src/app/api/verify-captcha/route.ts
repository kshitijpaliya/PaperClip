import { NextRequest, NextResponse } from "next/server";

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "CAPTCHA token is required" },
        { status: 400 }
      );
    }

    // Verify with Cloudflare Turnstile
    const formData = new FormData();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    formData.append("response", token);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const result: TurnstileResponse = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "CAPTCHA verified successfully",
      });
    } else {
      console.error("Turnstile verification failed:", result["error-codes"]);
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
