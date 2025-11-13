"use client";

import { signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";

type SignOutButtonProps = {
  callbackUrl?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function SignOutButton({
  callbackUrl = "/",
  children = "Sign out",
  onClick,
  disabled,
  className,
  ...rest
}: SignOutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      try {
        setIsPending(true);
        await signOut({ callbackUrl });
      } finally {
        setIsPending(false);
      }
    },
    [callbackUrl, onClick]
  );

  const combinedClassName = [
    "cursor-pointer border-none bg-transparent p-0 font-inherit text-inherit",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={combinedClassName}
      {...rest}
    >
      {children}
    </button>
  );
}
