/**
 * AUTO-GENERATED FILE BY scripts/set-brand.js
 * DO NOT EDIT DIRECTLY.
 * Source of truth: brand.config.json at project root.
 */

export const BRAND = {
  "name": "Fox",
  "fullName": "Fox Live",
  "arabicName": "Fox",
  "shortArabicName": "Fox",
  "slug": "fox",
  "scheme": "fox",
  "initial": "F",
  "wordmark": "FOX",
  "tagline": "Live Streaming & Social Community",
  "supportEmail": "support@fox.live"
} as const;

export type BrandConfig = typeof BRAND;

export function adminTitle(pageTitle: string): string {
  return `${pageTitle} | ${BRAND.shortArabicName}`;
}

export default BRAND;
