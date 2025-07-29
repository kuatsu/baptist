import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface GitStatus {
  isDirty: boolean;
  dirtyFiles: string[];
  checkedDirectories: string[];
  gitRepositories: string[];
}

/**
 * Check if the provided directories have uncommitted modified files
 */
export function checkGitStatus(directories: string[]): GitStatus {
  const dirtyFiles: string[] = [];
  const checkedDirectories: string[] = [];
  const gitRepositories: string[] = [];

  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }

    const absoluteDirectory = path.resolve(directory);
    checkedDirectories.push(absoluteDirectory);

    try {
      // Check if this directory is in a git repository
      const gitDirectory = execSync('git rev-parse --show-toplevel', {
        cwd: absoluteDirectory,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();

      if (!gitRepositories.includes(gitDirectory)) {
        gitRepositories.push(gitDirectory);
      }

      // Get status of files, focusing on modified files only
      const output = execSync('git status --porcelain', {
        cwd: absoluteDirectory,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const lines = output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      // Check for modified files (M status in second column) or renamed files
      for (const line of lines) {
        const status = line.slice(0, 2);
        const filePath = line.slice(3);

        // Check for modified files (M in any position) or renamed files (R)
        if (status.includes('M') || status.startsWith('R')) {
          const fullPath = path.resolve(absoluteDirectory, filePath);
          if (!dirtyFiles.includes(fullPath)) {
            dirtyFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Directory is not in a git repository - this is okay, we'll skip git operations
      console.warn(
        `Warning: Directory ${directory} is not in a git repository. File renames will use regular mv instead of git mv.`
      );
    }
  }

  return {
    isDirty: dirtyFiles.length > 0,
    dirtyFiles,
    checkedDirectories,
    gitRepositories,
  };
}

/**
 * Execute a git mv command in the appropriate directory
 */
export function gitMoveFile(oldPath: string, newPath: string, workingDirectory?: string): void {
  const options = workingDirectory
    ? { stdio: 'inherit' as const, cwd: workingDirectory }
    : { stdio: 'inherit' as const };
  execSync(`git mv "${oldPath}" "${newPath}"`, options);
}

/**
 * Execute multiple git mv commands from a script
 */
export function executeGitMoveCommands(commands: string[], workingDirectory?: string): void {
  if (commands.length === 0) return;

  const scriptContent = [
    '#!/bin/bash',
    'set -e', // Exit on error
    ...commands.map((cmd) => `git ${cmd}`),
  ].join('\n');

  const scriptPath = './git-rename-commands.sh';

  try {
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    const options = workingDirectory
      ? { stdio: 'inherit' as const, cwd: workingDirectory }
      : { stdio: 'inherit' as const };
    execSync(`bash "${scriptPath}"`, options);
  } finally {
    // Clean up script file
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
  }
}
