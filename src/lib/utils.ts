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

/**
 * Normalize a Malaysia IC number by stripping all non-digit characters.
 * This allows users to enter IC with or without dashes, but we always store 12 digits.
 */
export function normalizeMalaysiaIc(input: string): string {
  return (input || '').replace(/\D/g, '')
}

/**
 * Validate Malaysia IC number.
 * Requirement: exactly 12 numeric digits after normalization.
 */
export function isValidMalaysiaIc(input: string): boolean {
  const digits = normalizeMalaysiaIc(input)
  return digits.length === 12
}
