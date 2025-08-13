"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      scriptProps={{
        async: true
      }}
    >
      <main className="bg-background w-screen h-screen flex justify-center items-center">
        {children}
      </main>
    </GoogleReCaptchaProvider>
  );
}
