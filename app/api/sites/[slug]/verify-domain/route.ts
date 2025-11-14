import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSite, kv, type SiteRecord, setDomainMapping } from "@/lib/kv";
import { verifyDomainDNS } from "@/lib/domain-verification";
import { addVercelDomain } from "@/lib/vercel-domains";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const user = await getCurrentUser();
    const userId = (user as any)?.id as string | undefined;
    if (!userId && process.env.BXSITE_DEV_SKIP_AUTH !== "1") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const site = await getSite(slug.toLowerCase());
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      process.env.BXSITE_DEV_SKIP_AUTH !== "1" &&
      site.ownerUserId !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!site.customDomain || !site.domainVerificationToken) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      );
    }

    const verification = await verifyDomainDNS(
      site.customDomain,
      site.domainVerificationToken
    );

    if (verification.verified) {
      const updatedRecord: SiteRecord = {
        ...site,
        domainVerified: true,
      };
      await kv.set(`site:${site.slug}`, updatedRecord);
      if (site.customDomain) {
        await setDomainMapping(site.customDomain, site.slug);

        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID;
        if (projectId) {
          const vercelResult = await addVercelDomain(
            site.customDomain,
            projectId,
            teamId
          );
          if (
            !vercelResult.success &&
            vercelResult.error !== "VERCEL_TOKEN not configured"
          ) {
            console.warn(
              `Failed to add domain to Vercel: ${vercelResult.error}`
            );
          }
        }
      }
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json(
        { verified: false, error: verification.error },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err.message },
      { status: 500 }
    );
  }
}
