import Image from "next/image";
import { cn } from "../lib/utils";

type AvatarProps = {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  return (
    <div className={cn("relative rounded-full overflow-hidden", sizeClasses[size], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  );
} 