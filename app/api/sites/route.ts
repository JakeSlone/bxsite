import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  kv,
  getSite,
  listSitesByUser,
  type SiteRecord,
  getSiteByDomain,
  setDomainMapping,
  removeDomainMapping,
} from "@/lib/kv";
import {
  generateVerificationToken,
  validateDomainFormat,
} from "@/lib/domain-verification";

const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

async function rateLimitWrites(
  userId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `ratelimit:writes:${userId}`;
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, 60);
  }
  if (count > 10) {
    return { allowed: false, retryAfter: 60 };
  }
  return { allowed: true };
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    let userId = (user as any)?.id as string | undefined;
    if (!userId && process.env.BXSITE_DEV_SKIP_AUTH === "1") {
      userId = "dev";
    }
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const slug = String(body?.slug ?? "")
      .trim()
      .toLowerCase();
    const markdown = String(body?.markdown ?? "");
    const customDomain = body?.customDomain
      ? String(body.customDomain).trim().toLowerCase()
      : null;

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug. Use a-z, 0-9, hyphens, 3-30 chars." },
        { status: 400 }
      );
    }

    if (customDomain) {
      const domainValidation = validateDomainFormat(customDomain);
      if (!domainValidation.valid) {
        return NextResponse.json(
          { error: domainValidation.error },
          { status: 400 }
        );
      }

      const existingSite = await getSiteByDomain(customDomain);
      if (existingSite && existingSite.slug !== slug) {
        return NextResponse.json(
          { error: "This domain is already in use by another site." },
          { status: 409 }
        );
      }
    }

    const rl = await rateLimitWrites(userId);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const current = await getSite(slug);
    if (current && current.ownerUserId !== userId) {
      return NextResponse.json(
        { error: "This slug is already taken." },
        { status: 409 }
      );
    }

    const isNewSite = !current;
    if (isNewSite) {
      const userSites = await listSitesByUser(userId);
      if (userSites.length >= 5) {
        return NextResponse.json(
          {
            error:
              "You have reached the limit of 5 sites. Please delete a site before creating a new one.",
          },
          { status: 403 }
        );
      }
    }

    const oldDomain = current?.customDomain;
    let domainVerificationToken = current?.domainVerificationToken;
    let domainVerified = current?.domainVerified ?? false;

    if (customDomain) {
      if (oldDomain !== customDomain) {
        domainVerificationToken = generateVerificationToken();
        domainVerified = false;

        if (oldDomain) {
          await removeDomainMapping(oldDomain);
        }

        await setDomainMapping(customDomain, slug);
      }
    } else {
      if (oldDomain) {
        await removeDomainMapping(oldDomain);
      }
      domainVerificationToken = undefined;
      domainVerified = false;
    }

    const record: SiteRecord = {
      slug,
      markdown,
      ownerUserId: userId,
      updatedAt: Date.now(),
      ...(customDomain
        ? {
            customDomain,
            domainVerificationToken,
            domainVerified,
          }
        : {
            customDomain: undefined,
            domainVerificationToken: undefined,
            domainVerified: undefined,
          }),
    };
    await kv.set(`site:${slug}`, record);
    await kv.sadd(`sites:byUser:${userId}`, slug);
    revalidatePath(`/s/${slug}`);

    return NextResponse.json({
      ok: true,
      ...(customDomain && {
        domainVerificationToken,
        domainVerified,
      }),
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
