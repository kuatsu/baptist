import fs from 'node:fs';
import path from 'node:path';

import { camelCaseToKebabCase } from './helpers.js';

/**
 * File extensions that typically contain import statements
 */
const IMPORT_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte']);

/**
 * Regex patterns to match import statements
 */
const IMPORT_PATTERNS = [
  // ES6 imports: import ... from '...'
  /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
  // CommonJS require: require('...')
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // Dynamic imports: import('...')
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/**
 * Update import statements in a file
 */
function updateImportsInFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const fileExtension = path.extname(filePath);
  if (!IMPORT_FILE_EXTENSIONS.has(fileExtension)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const pattern of IMPORT_PATTERNS) {
    content = content.replace(pattern, (match, importPath) => {
      // Convert the import path to kebab-case
      const kebabImportPath = convertImportPathToKebabCase(importPath);

      if (importPath !== kebabImportPath) {
        hasChanges = true;
        return match.replace(importPath, kebabImportPath);
      }

      return match;
    });
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

/**
 * Convert an import path to kebab-case
 */
function convertImportPathToKebabCase(importPath: string): string {
  // Don't modify external packages (no relative path indicators)
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return importPath;
  }

  const parts = importPath.split('/');
  const convertedParts = parts.map((part) => {
    // Don't convert '.' or '..' or empty strings
    if (part === '.' || part === '..' || part === '') {
      return part;
    }

    // Handle files with extensions
    const extension = path.extname(part);
    if (extension) {
      const nameWithoutExtension = path.basename(part, extension);
      return camelCaseToKebabCase(nameWithoutExtension) + extension;
    }

    // Handle directory names or files without extensions
    return camelCaseToKebabCase(part);
  });

  return convertedParts.join('/');
}

/**
 * Update import statements in all files within the processed directories
 */
export function updateImportsInFiles(directories: string[]): string[] {
  const updatedFiles: string[] = [];

  // Scan all files in the directories
  for (const directory of directories) {
    const files = getAllFilesRecursively(directory);

    for (const file of files) {
      const wasUpdated = updateImportsInFile(file);
      if (wasUpdated) {
        updatedFiles.push(file);
      }
    }
  }

  return updatedFiles;
}

/**
 * Recursively get all files in a directory
 */
function getAllFilesRecursively(directoryPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    return files;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    // Skip certain directories
    // TODO: Make configurable
    if (entry.isDirectory()) {
      const directoryName = entry.name;
      if (
        directoryName.startsWith('.') ||
        directoryName === 'node_modules' ||
        directoryName === 'dist' ||
        directoryName === 'build'
      ) {
        continue;
      }

      files.push(...getAllFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
