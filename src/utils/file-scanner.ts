import fs from 'node:fs';
import path from 'node:path';

import { camelCaseToKebabCase } from './helpers.js';

export interface FileSystemItem {
  originalPath: string;
  newPath: string;
  isDirectory: boolean;
  needsRename: boolean;
}

export interface ScanResult {
  items: FileSystemItem[];
  totalItems: number;
}

/**
 * Skip these patterns when scanning
 */
const SKIP_PATTERNS = [
  /^\./, // Hidden files/directories
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.nyc_output/,
];

/**
 * Check if a path should be skipped
 */
function shouldSkip(itemPath: string): boolean {
  const basename = path.basename(itemPath);
  return SKIP_PATTERNS.some((pattern) => pattern.test(basename));
}

/**
 * Scan a single directory recursively
 */
function scanDirectoryRecursive(directoryPath: string, basePath: string = ''): FileSystemItem[] {
  const items: FileSystemItem[] = [];

  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    return items;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (shouldSkip(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Process directory
      const newDirectoryName = camelCaseToKebabCase(entry.name);
      const newRelativePath = path.join(basePath, newDirectoryName);
      const needsRename = entry.name !== newDirectoryName;

      items.push({
        originalPath: relativePath,
        newPath: newRelativePath,
        isDirectory: true,
        needsRename,
      });

      // Recursively scan subdirectory
      const subdirItems = scanDirectoryRecursive(fullPath, newRelativePath);
      items.push(...subdirItems);
    } else if (entry.isFile()) {
      // Process file
      const fileExtension = path.extname(entry.name);
      const fileName = path.basename(entry.name, fileExtension);
      const newFileName = camelCaseToKebabCase(fileName);
      const newRelativePath = path.join(basePath, newFileName + fileExtension);
      const needsRename = entry.name !== newFileName + fileExtension;

      items.push({
        originalPath: relativePath,
        newPath: newRelativePath,
        isDirectory: false,
        needsRename,
      });
    }
  }

  return items;
}

/**
 * Scan multiple directories and return all files/directories that need processing
 */
export function scanDirectories(directories: string[]): ScanResult {
  const allItems: FileSystemItem[] = [];

  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }

    if (!fs.statSync(directory).isDirectory()) {
      throw new Error(`Path is not a directory: ${directory}`);
    }

    const items = scanDirectoryRecursive(directory, directory);
    allItems.push(...items);
  }

  return {
    items: allItems,
    totalItems: allItems.length,
  };
}

/**
 * Get items that need to be renamed
 */
export function getItemsToRename(scanResult: ScanResult): FileSystemItem[] {
  return scanResult.items.filter((item) => item.needsRename);
}

/**
 * Generate git mv commands for renaming items
 */
export function generateMoveCommands(items: FileSystemItem[]): string[] {
  const commands: string[] = [];

  // Sort by depth (directories first, deepest first to avoid conflicts)
  const sortedItems = [...items].sort((a, b) => {
    // Directories come before files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    // Deeper paths come first
    const aDepth = a.originalPath.split(path.sep).length;
    const bDepth = b.originalPath.split(path.sep).length;
    return bDepth - aDepth;
  });

  for (const item of sortedItems) {
    if (item.needsRename) {
      // Handle case-only renames by using a temporary name
      const isCaseOnlyRename = item.originalPath.toLowerCase() === item.newPath.toLowerCase();

      if (isCaseOnlyRename) {
        const temporaryPath = `${item.newPath}.temp-rename`;
        commands.push(`mv "${item.originalPath}" "${temporaryPath}"`, `mv "${temporaryPath}" "${item.newPath}"`);
      } else {
        commands.push(`mv "${item.originalPath}" "${item.newPath}"`);
      }
    }
  }

  return commands;
}
