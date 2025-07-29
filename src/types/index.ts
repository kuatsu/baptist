export interface FileSystemItem {
  originalPath: string;
  newPath: string;
  isDirectory: boolean;
  needsRename: boolean;
}
