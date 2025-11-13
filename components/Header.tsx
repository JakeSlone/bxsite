import SignOutButton from "@/components/SignOutButton";
import SignInButton from "@/components/SignInButton";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="flex flex-col gap-2 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-6">
        <a href="/" className="text-3xl font-semibold text-slate-100">
          bxsite
        </a>
        {user && (
          <a
            href="/dashboard"
            className="text-xs text-sky-300 underline underline-offset-4 hover:text-sky-200"
          >
            dashboard
          </a>
        )}
      </div>
      {user ? (
        <div className="space-x-3 text-xs text-slate-300">
          <span>signed in as {user.name}</span>
          <SignOutButton className="text-sky-300 underline underline-offset-4">
            sign out
          </SignOutButton>
        </div>
      ) : (
        <SignInButton className="self-start text-xs text-sky-300 underline underline-offset-4">
          sign in
        </SignInButton>
      )}
    </header>
  );
}
