/**
 * Canonical mandatory profile fields for Shaadi Mantrana.
 *
 * These are the ONLY fields counted toward profile completeness.
 * Both frontend and backend must use this same list.
 *
 * 12 text fields + 1 image field = 13 total.
 * Each field contributes 100/13 ≈ 7.69 percentage points.
 */

export const MANDATORY_PROFILE_FIELDS = [
  'name',
  'gender',
  'dateOfBirth',
  'maritalStatus',
  'education',
  'occupation',
  'nativePlace',
  'height',
  'complexion',
  'manglik',
  'eatingHabit',
  'about',
] as const;

export type MandatoryProfileField = (typeof MANDATORY_PROFILE_FIELDS)[number];

/** Total mandatory fields including the image/photo field */
export const TOTAL_MANDATORY_FIELDS = MANDATORY_PROFILE_FIELDS.length + 1; // +1 for photo

/** Percentage points each field contributes */
export const COMPLETENESS_INCREMENT = 100 / TOTAL_MANDATORY_FIELDS;

/**
 * Calculate profile completeness from a profile object.
 * Works on the frontend where `images` may still be a temp File/URL.
 *
 * @param profile       - The profile data object
 * @param hasTempImage  - Whether a temp image has been selected but not yet saved
 */
export function calculateProfileCompletion(
  profile: Record<string, any> | null | undefined,
  hasTempImage = false
): number {
  if (!profile) return 0;

  let completed = 0;

  for (const field of MANDATORY_PROFILE_FIELDS) {
    const val = profile[field];
    if (typeof val === 'string' && val.trim() !== '') {
      completed++;
    } else if (typeof val === 'number' && val > 0) {
      completed++;
    } else if (val instanceof Date && !isNaN(val.getTime())) {
      completed++;
    }
  }

  // Image field
  const imagesVal = profile['images'];
  const hasExistingImage =
    (Array.isArray(imagesVal) && imagesVal.length > 0) ||
    (typeof imagesVal === 'string' && imagesVal.trim() !== '');

  if (hasExistingImage || hasTempImage) {
    completed++;
  }

  return Math.min(100, Math.round((completed / TOTAL_MANDATORY_FIELDS) * 100));
}
