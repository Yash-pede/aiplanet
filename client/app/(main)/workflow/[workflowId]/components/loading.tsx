import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center p-2 gap-4">
      <Skeleton className="w-[var(--sidebar-width)] h-[calc(100vh-5rem)]" />
      <Skeleton className="w-full h-[calc(100vh-5rem)]" />
    </div>
  );
}
