import type { Metadata } from "next";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import Providers from "./providers";

// Every page here is cookie/auth-gated by middleware. Without this, Next.js
// statically prerenders pages with no server data dependency (most of them)
// and serves that cached HTML directly on repeat requests, bypassing
// middleware entirely — so the auth check silently stops running after the
// first hit. Forcing dynamic rendering keeps every request going through
// middleware, matching `next dev`'s behavior (which never does this caching).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EasyClaims CRM",
  description: "EasyClaims Membership CRM Workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
