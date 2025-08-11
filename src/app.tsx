import { ProgressBar } from '@inkjs/ui';
import { Box, Text, useApp } from 'ink';
import React, { useCallback, useEffect, useState } from 'react';

import { generateMoveCommands, getItemsToRename, scanDirectories } from './utils/file-scanner.js';
import { checkGitStatus, executeGitMoveCommands } from './utils/git.js';
import { updateImportsInFiles } from './utils/import-updater.js';
import { createLogEntry, writeLog } from './utils/logger.js';

type Props = {
  directories: string[];
  enableLogging: boolean;
  force: boolean;
};

type ProcessingStep =
  | 'checking-git'
  | 'scanning'
  | 'renaming'
  | 'updating-imports'
  | 'writing-log'
  | 'completed'
  | 'error';

interface ProcessingState {
  step: ProcessingStep;
  progress: number;
  message: string;
  error?: string;
  totalItems: number;
  processedItems: number;
}

export default function App({ directories, enableLogging, force }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<ProcessingState>({
    step: 'checking-git',
    progress: 0,
    message: 'Checking git status...',
    totalItems: 0,
    processedItems: 0,
  });

  /**
   * Small helper to avoid repeating the spread-and-merge pattern when updating
   * state. It is memoised so the reference stays stable across renders.
   */
  const updateState = useCallback(
    (partial: Partial<ProcessingState>) => setState((previous) => ({ ...previous, ...partial })),
    []
  );

  useEffect(() => {
    async function processDirectories() {
      try {
        // Step 1: Check git status
        updateState({
          step: 'checking-git',
          progress: 0,
          message: 'Checking git status...',
        });

        const gitStatus = checkGitStatus(directories);
        if (gitStatus && gitStatus.isDirty && !force) {
          updateState({
            step: 'error',
            error: `Git repository has uncommitted modified files in: ${gitStatus.gitRepositories
              .filter((repo) => gitStatus.dirtyFiles.some((file) => file.startsWith(repo)))
              .join(', ')}. Please commit or stash your changes first.`,
          });
          return;
        }

        // Step 2: Scan directories
        updateState({
          step: 'scanning',
          progress: 20,
          message: 'Scanning directories for files to rename...',
        });

        const scanResult = scanDirectories(directories);
        const itemsToRename = getItemsToRename(scanResult);

        if (itemsToRename.length === 0) {
          updateState({
            step: 'completed',
            progress: 100,
            message: 'No files or directories need to be renamed.',
            totalItems: scanResult.totalItems,
          });
          return;
        }

        updateState({
          totalItems: itemsToRename.length,
          message: `Found ${itemsToRename.length} items to rename...`,
        });

        // Step 3: Rename files and directories
        updateState({
          step: 'renaming',
          progress: 40,
          message: 'Renaming files and directories...',
        });

        const moveCommands = generateMoveCommands(itemsToRename);
        executeGitMoveCommands(moveCommands, gitStatus !== false);

        updateState({
          progress: 60,
          processedItems: itemsToRename.length,
        });

        // Step 4: Update import statements
        updateState({
          step: 'updating-imports',
          progress: 80,
          message: 'Updating import statements...',
        });

        const updatedFiles = updateImportsInFiles(directories);

        // Step 5: Write log if enabled
        if (enableLogging) {
          updateState({
            step: 'writing-log',
            progress: 90,
            message: 'Writing log file...',
          });

          const logEntry = createLogEntry(directories, itemsToRename, updatedFiles);
          writeLog(logEntry);
        }

        // Step 6: Complete
        updateState({
          step: 'completed',
          progress: 100,
          message: `✅ Successfully renamed ${itemsToRename.length} items and updated ${updatedFiles.length} files`,
        });
      } catch (error) {
        updateState({
          step: 'error',
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    }

    processDirectories();
  }, [directories, enableLogging, updateState]);

  // Exit after completion or error
  useEffect(() => {
    if (state.step === 'completed') {
      exit();
    } else if (state.step === 'error') {
      exit(new Error(state.error || 'Unknown error'));
    }
  }, [state.step, state.error, exit]);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          🔄 Baptist - Kebab-case File Converter
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Processing directories: {directories.join(', ')}</Text>
      </Box>

      {state.step === 'error' ? (
        <Box flexDirection="column">
          <Text color="red" bold>
            ❌ Error:
          </Text>
          <Text color="red">{state.error}</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>{state.message}</Text>
          </Box>

          <Box marginBottom={1}>
            <ProgressBar value={state.progress} />
          </Box>

          {state.totalItems > 0 && (
            <Box>
              <Text color="gray">
                Items processed: {state.processedItems}/{state.totalItems}
              </Text>
            </Box>
          )}

          {enableLogging && (
            <Box marginTop={1}>
              <Text color="yellow">📝 Logging enabled - will write to baptist.log</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
