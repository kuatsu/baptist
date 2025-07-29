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
