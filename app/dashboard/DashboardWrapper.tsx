"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardClient from "./DashboardClient";
import SignInModal from "@/components/SignInModal";
import SignInButton from "@/components/SignInButton";
import HeaderClient from "@/components/HeaderClient";

type DashboardWrapperProps = {
  user: any;
  initialSlug?: string;
  initialMarkdown?: string;
  mySlugs: string[];
  initialCustomDomain?: string;
  initialDomainVerified?: boolean;
  initialDomainVerificationToken?: string;
};

export default function DashboardWrapper({
  user: initialUser,
  initialSlug,
  initialMarkdown,
  mySlugs,
  initialCustomDomain,
  initialDomainVerified,
  initialDomainVerificationToken,
}: DashboardWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated =
    initialUser?.id || (status === "authenticated" && session);

  useEffect(() => {
    if (!isAuthenticated && status !== "loading") {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, status]);

  useEffect(() => {
    if (status === "authenticated" && session && showModal) {
      router.refresh();
    }
  }, [status, session, showModal, router]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 py-16 text-slate-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 font-mono">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <a href="/" className="text-3xl font-semibold text-slate-100">
              bxsite
            </a>
            <SignInButton className="text-xs text-sky-300 underline underline-offset-4">
              sign in
            </SignInButton>
          </div>
          <div>
            <h1 className="text-xl font-semibold mb-4 text-slate-100">
              Your bxsite
            </h1>
            <p className="text-slate-400">
              Please sign in to access your dashboard.
            </p>
          </div>
        </div>
        <SignInModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          canClose={false}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 py-16 text-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 font-mono">
        <HeaderClient user={initialUser} />
        <DashboardClient
          initialSlug={initialSlug}
          initialMarkdown={initialMarkdown}
          mySlugs={mySlugs}
          initialCustomDomain={initialCustomDomain}
          initialDomainVerified={initialDomainVerified}
          initialDomainVerificationToken={initialDomainVerificationToken}
        />
      </div>
    </main>
  );
}
