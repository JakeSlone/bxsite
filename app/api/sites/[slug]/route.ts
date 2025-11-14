import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getSite, kv, removeDomainMapping } from "@/lib/kv";
import { removeVercelDomain } from "@/lib/vercel-domains";

export async function GET(
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

    return NextResponse.json({
      slug: site.slug,
      markdown: site.markdown,
      updatedAt: site.updatedAt,
      customDomain: site.customDomain,
      domainVerified: site.domainVerified,
      domainVerificationToken: site.domainVerificationToken,
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const normalized = slug.toLowerCase();

    const user = await getCurrentUser();
    let userId = (user as any)?.id as string | undefined;
    if (!userId && process.env.BXSITE_DEV_SKIP_AUTH === "1") {
      userId = "dev";
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const site = await getSite(normalized);
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      site.ownerUserId !== userId &&
      process.env.BXSITE_DEV_SKIP_AUTH !== "1"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (site.customDomain) {
      await removeDomainMapping(site.customDomain);

      const projectId = process.env.VERCEL_PROJECT_ID;
      const teamId = process.env.VERCEL_TEAM_ID;
      if (projectId) {
        await removeVercelDomain(site.customDomain, projectId, teamId);
      }
    }

    await kv.del(`site:${normalized}`);
    await kv.srem(`sites:byUser:${site.ownerUserId}`, normalized);
    revalidatePath(`/s/${normalized}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
