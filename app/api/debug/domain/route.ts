import { NextResponse } from "next/server";
import { getSiteByDomain, kv } from "@/lib/kv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Domain parameter required" },
      { status: 400 }
    );
  }

  try {
    const mapping = await kv.get<string>(
      `domain:${domain.toLowerCase().trim()}`
    );

    const site = await getSiteByDomain(domain);

    return NextResponse.json({
      domain,
      mapping,
      site: site
        ? {
            slug: site.slug,
            customDomain: site.customDomain,
            domainVerified: site.domainVerified,
            hasCustomDomain: !!site.customDomain,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to check domain", details: err.message },
      { status: 500 }
    );
  }
}
