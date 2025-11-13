"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { kv, type SiteRecord, getSite, listSitesByUser } from "@/lib/kv";

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

export async function createOrUpdateSite(input: {
  slug: string;
  markdown: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !(user as any).id) {
    return { ok: false, error: "Not authenticated" };
  }
  const userId = (user as any).id as string;

  const rl = await rateLimitWrites(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: "Too many requests. Please wait a minute and try again.",
    };
  }

  const slug = input.slug.trim().toLowerCase();
  const markdown = input.markdown ?? "";
  if (!SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      error: "Invalid slug. Use a-z, 0-9, hyphens, 3-30 chars.",
    };
  }

  const current = await getSite(slug);
  if (current && current.ownerUserId !== userId) {
    return { ok: false, error: "This slug is already taken." };
  }

  // Check if this is a new site (not an update to an existing one)
  const isNewSite = !current;
  if (isNewSite) {
    const userSites = await listSitesByUser(userId);
    if (userSites.length >= 5) {
      return {
        ok: false,
        error:
          "You have reached the limit of 5 sites. Please delete a site before creating a new one.",
      };
    }
  }

  const record: SiteRecord = {
    slug,
    markdown,
    ownerUserId: userId,
    updatedAt: Date.now(),
  };
  await kv.set(`site:${slug}`, record);
  await kv.sadd(`sites:byUser:${userId}`, slug);
  revalidatePath(`/s/${slug}`);
  return { ok: true };
}

export async function getMySites(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user || !(user as any).id) return [];
  return listSitesByUser((user as any).id as string);
}
