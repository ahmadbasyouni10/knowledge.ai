"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./Button";

export function Header({ showBackButton = false, backHref = "/dashboard" }: { showBackButton?: boolean; backHref?: string }) {
  const { isSignedIn, user, isLoaded } = useUser();
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Link href={backHref} className="mr-3 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          )}
          <Link href={isSignedIn ? "/dashboard" : "/"} className="text-xl font-semibold text-indigo-600 hover:text-indigo-800">
            KnowledgeAI
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoaded ? (
            isSignedIn ? (
              <>
                <span className="text-sm text-gray-600">Welcome, {user?.firstName || 'User'}</span>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
                <div className="sm:hidden">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/sign-in" className="text-xs">Sign In</Link>
                  </Button>
                </div>
              </>
            )
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          )}
        </div>
      </div>
    </header>
  );
} 