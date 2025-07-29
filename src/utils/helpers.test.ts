import { describe, expect, test } from 'vitest';

import { camelCaseToKebabCase } from './helpers.js';

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
