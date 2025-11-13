"use client";

import { useState } from "react";
import SignInModal from "./SignInModal";

type SignInButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function SignInButton({
  className = "",
  children = "sign in with GitHub",
}: SignInButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children}
      </button>
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
