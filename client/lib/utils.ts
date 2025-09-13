import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...queryNodes: ClassValue[]) {
  return twMerge(clsx(queryNodes))
}
