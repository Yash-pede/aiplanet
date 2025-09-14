import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { validate as uuidValidate } from "uuid"

export function cn(...queryNodes: ClassValue[]) {
  return twMerge(clsx(queryNodes))
}

export const isUuid = (s: string) => uuidValidate(s)  