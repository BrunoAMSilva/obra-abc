/**
 * Image mapping utility for Obra ABC project
 * Clean implementation that only imports files that actually exist
 */

// Import actual images that exist in the project
import photo001 from '../assets/images/photo-001.jpg';
import photo002 from '../assets/images/photo-002.jpg';
import photo003 from '../assets/images/photo-003.jpg';
import photo004 from '../assets/images/photo-004.jpg';
import photo005 from '../assets/images/photo-005.jpg';
import photo006 from '../assets/images/photo-006.png';
import photo007 from '../assets/images/photo-007.jpg';
import photo008 from '../assets/images/photo-008.jpg';
import photo009 from '../assets/images/photo-009.jpg';
import photo010 from '../assets/images/photo-010.jpg';
import photo011 from '../assets/images/photo-011.jpg';
import photo012 from '../assets/images/photo-012.jpg';
import photo014 from '../assets/images/photo-014.jpg';
import photo015 from '../assets/images/photo-015.jpg';
import photo016 from '../assets/images/photo-016.jpg';
import photo017 from '../assets/images/photo-017.jpg';

// Import stock images
import economia001 from '../assets/stock/economia-001.jpg';
import materialEscolar001 from '../assets/stock/material-escolar-001.jpg';

// Import icon
import favicon from '../assets/icon/favicon-300x300.png';

/**
 * Image map for Astro project
 * Maps simple keys to actual image assets
 */
export const imagesMap: Record<string, ImageMetadata> = {
  // Main photos
  'photo-001': photo001,
  'photo-002': photo002,
  'photo-003': photo003,
  'photo-004': photo004,
  'photo-005': photo005,
  'photo-006': photo006,
  'photo-007': photo007,
  'photo-008': photo008,
  'photo-009': photo009,
  'photo-010': photo010,
  'photo-011': photo011,
  'photo-012': photo012,
  'photo-014': photo014,
  'photo-015': photo015,
  'photo-016': photo016,
  'photo-017': photo017,

  // Stock images
  'economia-001': economia001,
  'material-escolar-001': materialEscolar001,

  // Icon
  'favicon': favicon,
};

/**
 * Get image URL by key (for HTML src attributes)
 */
export function getImage(key: string): string {
  return imagesMap[key]?.src || '';
}

/**
 * Get image URL with fallback
 */
export function getImageWithFallback(key: string, fallback: string = ''): string {
  return imagesMap[key]?.src || fallback;
}

/**
 * Check if image exists in our map
 */
export function hasImage(key: string): boolean {
  return key in imagesMap;
}

/**
 * Get ImageMetadata object (for Astro Image component)
 */
export function getImageMetadata(key: string): ImageMetadata | undefined {
  return imagesMap[key];
}

/**
 * Get all available image keys
 */
export function getAvailableImages(): string[] {
  return Object.keys(imagesMap);
}

/**
 * Type for valid image keys
 */
export type ImageKey = keyof typeof imagesMap;
