import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Feature flags
export const FEATURES = {
  EVENTS_ENABLED: false, // Events temporarily hidden
  DONATIONS_ENABLED: true,
  CONTRIBUTIONS_ENABLED: false,
} as const
