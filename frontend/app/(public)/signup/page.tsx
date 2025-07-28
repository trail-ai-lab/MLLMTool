"use client"
export const dynamic = "force-dynamic"

import Image from "next/image"

import { SignupForm } from "@/components/forms/signup-form"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="https://trail.wcer.wisc.edu/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image
            src="/logo/trail-logo.svg"
            alt="TRAIL Logo"
            width={24}
            height={24}
            priority
            className="invert-0 dark:invert"
          />
          SLAI
        </a>
        <SignupForm />
      </div>
    </div>
  )
}
