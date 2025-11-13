import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";
import DashboardWrapper from "./DashboardWrapper";
import { getCurrentUser } from "@/lib/auth";
import { getSite, listSitesByUser } from "@/lib/kv";

export const metadata: Metadata = {
  title: "dashboard",
};

type DashboardPageProps = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function DashboardPage(props: DashboardPageProps) {
  const resolvedSearchParams = await props.searchParams;
  let user = await getCurrentUser();

  if (!(user as any)?.id && process.env.BXSITE_DEV_SKIP_AUTH === "1") {
    user = { id: "dev", email: undefined, name: "Dev User" } as any;
  }

  const userId = (user as any)?.id as string | undefined;
  const mySlugs = userId ? await listSitesByUser(userId) : [];
  const selectedSlug = resolvedSearchParams?.slug;
  let initialMarkdown = "";

  if (selectedSlug && userId) {
    const site = await getSite(selectedSlug);
    if (site && site.ownerUserId === userId) {
      initialMarkdown = site.markdown;
    }
  }

  return (
    <DashboardWrapper
      user={user}
      initialSlug={selectedSlug}
      initialMarkdown={initialMarkdown}
      mySlugs={mySlugs}
    />
  );
}
