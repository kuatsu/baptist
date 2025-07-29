import { describe, expect, test } from 'vitest';

import { camelCaseToKebabCase, sortItemsForSafeRenaming } from './helpers.js';
import type { FileSystemItem } from '../types/index.js';

describe('camelCaseToKebabCase', () => {
  test('converts basic camelCase to kebab-case', () => {
    expect(camelCaseToKebabCase('firstName')).toBe('first-name');
    expect(camelCaseToKebabCase('lastName')).toBe('last-name');
    expect(camelCaseToKebabCase('userName')).toBe('user-name');
  });

  test('handles empty strings and null/undefined-like cases', () => {
    expect(camelCaseToKebabCase('')).toBe('');
    expect(camelCaseToKebabCase(' ')).toBe(' ');
  });

  test('handles single characters', () => {
    expect(camelCaseToKebabCase('a')).toBe('a');
    expect(camelCaseToKebabCase('A')).toBe('a');
    expect(camelCaseToKebabCase('1')).toBe('1');
  });

  test('handles consecutive uppercase letters', () => {
    expect(camelCaseToKebabCase('XMLHttpRequest')).toBe('xml-http-request');
    expect(camelCaseToKebabCase('HTMLElement')).toBe('html-element');
    expect(camelCaseToKebabCase('getHTMLElement')).toBe('get-html-element');
    expect(camelCaseToKebabCase('parseXMLData')).toBe('parse-xml-data');
  });

  test('handles numbers in camelCase', () => {
    expect(camelCaseToKebabCase('user123Id')).toBe('user123-id');
    expect(camelCaseToKebabCase('version2Update')).toBe('version2-update');
    expect(camelCaseToKebabCase('item1Name')).toBe('item1-name');
    expect(camelCaseToKebabCase('test123ABC')).toBe('test123-abc');
  });

  test('handles strings starting with uppercase', () => {
    expect(camelCaseToKebabCase('FirstName')).toBe('first-name');
    expect(camelCaseToKebabCase('UserName')).toBe('user-name');
    expect(camelCaseToKebabCase('XMLParser')).toBe('xml-parser');
  });

  test('does not change strings already in kebab-case', () => {
    expect(camelCaseToKebabCase('first-name')).toBe('first-name');
    expect(camelCaseToKebabCase('user-name')).toBe('user-name');
    expect(camelCaseToKebabCase('xml-http-request')).toBe('xml-http-request');
    expect(camelCaseToKebabCase('already-kebab-case')).toBe('already-kebab-case');
  });

  test('handles multiple consecutive uppercase letters correctly', () => {
    expect(camelCaseToKebabCase('XMLHTTPSConnection')).toBe('xmlhttps-connection');
    expect(camelCaseToKebabCase('getXMLHTTPRequest')).toBe('get-xmlhttp-request');
    expect(camelCaseToKebabCase('parseJSONData')).toBe('parse-json-data');
  });

  test('handles lowercase strings', () => {
    expect(camelCaseToKebabCase('lowercase')).toBe('lowercase');
    expect(camelCaseToKebabCase('alllowercase')).toBe('alllowercase');
  });

  test('handles uppercase strings', () => {
    expect(camelCaseToKebabCase('ABC')).toBe('abc');
    expect(camelCaseToKebabCase('UPPERCASE')).toBe('uppercase');
  });
});

describe('sortItemsForSafeRenaming', () => {
  test('sorts directories before files', () => {
    const items: FileSystemItem[] = [
      { originalPath: 'file.txt', newPath: 'file.txt', isDirectory: false, needsRename: false },
      { originalPath: 'dir', newPath: 'dir', isDirectory: true, needsRename: false },
      { originalPath: 'another-file.js', newPath: 'another-file.js', isDirectory: false, needsRename: false },
    ];

    const sorted = sortItemsForSafeRenaming(items);

    expect(sorted[0].isDirectory).toBe(true);
    expect(sorted[0].originalPath).toBe('dir');
    expect(sorted[1].isDirectory).toBe(false);
    expect(sorted[2].isDirectory).toBe(false);
  });

  test('sorts parent directories before child directories', () => {
    const items: FileSystemItem[] = [
      {
        originalPath: 'parent/child/grandchild',
        newPath: 'parent/child/grandchild',
        isDirectory: true,
        needsRename: false,
      },
      { originalPath: 'parent', newPath: 'parent', isDirectory: true, needsRename: false },
      { originalPath: 'parent/child', newPath: 'parent/child', isDirectory: true, needsRename: false },
    ];

    const sorted = sortItemsForSafeRenaming(items);

    expect(sorted[0].originalPath).toBe('parent');
    expect(sorted[1].originalPath).toBe('parent/child');
    expect(sorted[2].originalPath).toBe('parent/child/grandchild');
  });

  test('handles mixed files and directories with proper ordering', () => {
    const items: FileSystemItem[] = [
      { originalPath: 'deep/nested/file.txt', newPath: 'deep/nested/file.txt', isDirectory: false, needsRename: true },
      { originalPath: 'deep/nested', newPath: 'deep/nested', isDirectory: true, needsRename: true },
      { originalPath: 'shallow/file.js', newPath: 'shallow/file.js', isDirectory: false, needsRename: true },
      { originalPath: 'deep', newPath: 'deep', isDirectory: true, needsRename: true },
      { originalPath: 'shallow', newPath: 'shallow', isDirectory: true, needsRename: true },
      { originalPath: 'root-file.txt', newPath: 'root-file.txt', isDirectory: false, needsRename: true },
    ];

    const sorted = sortItemsForSafeRenaming(items);

    // All directories should come first, ordered by depth (shallow to deep)
    expect(sorted[0].originalPath).toBe('deep');
    expect(sorted[0].isDirectory).toBe(true);
    expect(sorted[1].originalPath).toBe('shallow');
    expect(sorted[1].isDirectory).toBe(true);
    expect(sorted[2].originalPath).toBe('deep/nested');
    expect(sorted[2].isDirectory).toBe(true);

    // Then files should come after directories
    expect(sorted[3].isDirectory).toBe(false);
    expect(sorted[4].isDirectory).toBe(false);
    expect(sorted[5].isDirectory).toBe(false);
  });

  test('handles case-only renames correctly (real-world scenario)', () => {
    const items: FileSystemItem[] = [
      {
        originalPath: 'test-data/hooks/logic/CoolThing.txt',
        newPath: 'test-data/hooks/logic/cool-thing.txt',
        isDirectory: false,
        needsRename: true,
      },
      {
        originalPath: 'test-data/HelloWorld.txt',
        newPath: 'test-data/hello-world.txt',
        isDirectory: false,
        needsRename: true,
      },
      { originalPath: 'test-data/hooks/Logic', newPath: 'test-data/hooks/logic', isDirectory: true, needsRename: true },
      { originalPath: 'test-data/Hooks', newPath: 'test-data/hooks', isDirectory: true, needsRename: true },
    ];

    const sorted = sortItemsForSafeRenaming(items);

    // Parent directory should come before child directory
    expect(sorted[0].originalPath).toBe('test-data/Hooks');
    expect(sorted[0].isDirectory).toBe(true);
    expect(sorted[1].originalPath).toBe('test-data/hooks/Logic');
    expect(sorted[1].isDirectory).toBe(true);

    // Files come after directories
    expect(sorted[2].isDirectory).toBe(false);
    expect(sorted[3].isDirectory).toBe(false);
  });

  test('preserves original array and returns new sorted array', () => {
    const items: FileSystemItem[] = [
      { originalPath: 'z-file.txt', newPath: 'z-file.txt', isDirectory: false, needsRename: false },
      { originalPath: 'a-dir', newPath: 'a-dir', isDirectory: true, needsRename: false },
    ];

    const originalOrder = items.map((item) => item.originalPath);
    const sorted = sortItemsForSafeRenaming(items);

    // Original array should be unchanged
    expect(items.map((item) => item.originalPath)).toEqual(originalOrder);

    // Sorted array should be different
    expect(sorted).not.toBe(items);
    expect(sorted[0].originalPath).toBe('a-dir');
    expect(sorted[1].originalPath).toBe('z-file.txt');
  });

  test('handles empty array', () => {
    const items: FileSystemItem[] = [];
    const sorted = sortItemsForSafeRenaming(items);

    expect(sorted).toEqual([]);
    expect(sorted).not.toBe(items); // Should return new array
  });
});
