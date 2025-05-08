"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

type BackButtonProps = {
  href?: string;
  className?: string;
};

export function BackButton({ href, className = "" }: BackButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-1 text-gray-600 hover:text-gray-900 ${className}`}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span>Back</span>
    </Button>
  );
} 