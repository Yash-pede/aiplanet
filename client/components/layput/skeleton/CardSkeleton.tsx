import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { JSX } from "react";

interface SkeletonCardProps {
  belowContent?: JSX.Element;
  className?: string;
}

export function SkeletonCard({ className, belowContent }: SkeletonCardProps) {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className={cn("h-[125px] w-[250px] rounded-xl", className)} />
      {belowContent}
    </div>
  );
}
