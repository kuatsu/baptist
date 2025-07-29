import type { FileSystemItem } from '../types/index.js';

/**
 * Converts a camelCase string to kebab-case.
 *
 * @param input - The camelCase string to convert
 * @returns The kebab-case version of the input string
 *
 * @example
 * camelCaseToKebabCase('firstName') // 'first-name'
 * camelCaseToKebabCase('XMLHttpRequest') // 'xml-http-request'
 * camelCaseToKebabCase('user123Id') // 'user123-id'
 * camelCaseToKebabCase('getHTMLElement') // 'get-html-element'
 * camelCaseToKebabCase('') // ''
 * camelCaseToKebabCase('a') // 'a'
 */
export function camelCaseToKebabCase(input: string): string {
  // Handle empty string or null/undefined
  if (!input || input.length === 0) {
    return '';
  }

  // Handle single character
  if (input.length === 1) {
    return input.toLowerCase();
  }

  // If the string is already kebab-case (contains hyphens and no uppercase), return as-is
  if (input.includes('-') && input === input.toLowerCase()) {
    return input;
  }

  return (
    input
      // Insert hyphen before uppercase letters that follow lowercase letters or digits
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
      // Insert hyphen before uppercase letters that are followed by lowercase letters,
      // but only if they're part of a sequence of uppercase letters
      .replaceAll(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      // Convert to lowercase
      .toLowerCase()
  );
}

/**
 * Sorts file system items for safe renaming operations.
 * Ensures that parent directories are renamed before their children to avoid path conflicts.
 *
 * @param items - Array of FileSystemItem objects to sort
 * @returns A new sorted array of FileSystemItem objects
 *
 * @example
 * const items = [
 *   { originalPath: 'dir/SubDir', isDirectory: true, needsRename: true },
 *   { originalPath: 'dir', isDirectory: true, needsRename: true },
 *   { originalPath: 'file.txt', isDirectory: false, needsRename: true }
 * ];
 * const sorted = sortItemsForSafeRenaming(items);
 * // Result: ['dir', 'dir/SubDir', 'file.txt'] (parent dir first, then child dir, then files)
 */
export function sortItemsForSafeRenaming(items: FileSystemItem[]): FileSystemItem[] {
  return [...items].sort((a, b) => {
    // Directories come before files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    // For directories: shallower paths come first (parents before children)
    // For files: deeper paths come first (to handle any edge cases where file order matters)
    if (a.isDirectory && b.isDirectory) {
      const aDepth = a.originalPath.split('/').length;
      const bDepth = b.originalPath.split('/').length;
      return aDepth - bDepth; // Ascending order for directories (shallow first)
    } else {
      const aDepth = a.originalPath.split('/').length;
      const bDepth = b.originalPath.split('/').length;
      return bDepth - aDepth; // Descending order for files (deep first)
    }
  });
}
