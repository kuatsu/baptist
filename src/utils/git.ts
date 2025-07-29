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
export function checkGitStatus(directories: string[]): false | GitStatus {
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

      // Check if this directory is git-ignored
      try {
        execSync('git check-ignore .', {
          cwd: absoluteDirectory,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        // If check-ignore succeeds (exit code 0), the directory is ignored
        return false;
      } catch {
        // If check-ignore fails (non-zero exit), the directory is not ignored, continue with git operations
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
      return false;
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
 * Execute multiple git mv commands directly (no temporary script).
 *
 * Each entry in `commands` is expected to be a shell snippet that would normally
 * follow the `git` keyword – for example `mv \"old\" \"new\"` produced by
 * `generateMoveCommands`. This function prefixes each command with `git` and
 * executes it via `execSync`, capturing output for better error reporting.
 */
export function executeGitMoveCommands(commands: string[], prefixGit: boolean, workingDirectory?: string): void {
  if (commands.length === 0) return;

  for (const cmd of commands) {
    // Prefix each command with `git` so that we run `git mv` rather than plain `mv`.
    const fullCommand = prefixGit ? `git ${cmd}` : cmd;
    try {
      const output = execSync(fullCommand, {
        cwd: workingDirectory,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Show output if there is any (though git mv is usually silent on success)
      if (output.trim()) {
        console.log(output.trim());
      }
    } catch (error: unknown) {
      // Create a detailed error message with raw command output
      let errorMessage = `Command failed: ${fullCommand}`;

      if (error instanceof Error && 'stderr' in error && error.stderr) {
        errorMessage += `\nStderr: ${error.stderr.toString().trim()}`;
      }

      if (error instanceof Error && 'stdout' in error && error.stdout) {
        errorMessage += `\nStdout: ${error.stdout.toString().trim()}`;
      }

      if (error instanceof Error && 'status' in error && error.status !== undefined) {
        errorMessage += `\nExit code: ${error.status}`;
      }

      if (error instanceof Error && 'signal' in error && error.signal) {
        errorMessage += `\nSignal: ${error.signal}`;
      }

      // Throw a new error with the enhanced message
      throw new Error(errorMessage);
    }
  }
}
