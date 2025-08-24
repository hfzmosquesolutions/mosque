import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Feature flags
export const FEATURES = {
  EVENTS_ENABLED: true, // Always enabled for build compatibility
  DONATIONS_ENABLED: true,
  CONTRIBUTIONS_ENABLED: false,
} as const

// Runtime feature flags (can be controlled via environment variables)
export const RUNTIME_FEATURES = {
  // Events are hidden for all users
  EVENTS_VISIBLE: false,
} as const
