import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSiteByDomain } from "@/lib/kv";

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  if (!host.endsWith("bxsite.com")) {
    const domain = host.split(":")[0];
    const site = await getSiteByDomain(domain);

    if (site && site.domainVerified && site.customDomain) {
      return NextResponse.rewrite(new URL(`/s/${site.slug}`, req.url));
    }

    return NextResponse.next();
  }

  const sub = host.split(".")[0];
  if (sub && sub !== "www" && sub !== "bxsite") {
    return NextResponse.rewrite(new URL(`/s/${sub}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
