"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
}: TurnstileCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => {
          setIsVerified(true);
          onVerify(token);
        }}
        onError={() => {
          setIsVerified(false);
          onError?.();
        }}
        onExpire={() => {
          setIsVerified(false);
          onExpire?.();
        }}
      />
    </div>
  );
}
