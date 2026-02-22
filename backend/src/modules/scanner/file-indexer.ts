import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out',
  'public',
  'assets',
  'static',
  '.cache',
  'vendor',
]);

const ALLOWED_EXTENSIONS = new Set([
  // JavaScript / TypeScript
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  // Python
  '.py',
  // Java / Kotlin
  '.java', '.kt', '.kts',
  // C / C++
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
  // Go
  '.go',
  // Rust
  '.rs',
  // Ruby
  '.rb',
  // PHP
  '.php',
  // C# / .NET
  '.cs',
  // Shell
  '.sh', '.bash',
  // Config / IaC (often contain secrets / misconfigs)
  '.yaml', '.yml', '.json', '.env', '.toml', '.tf', '.hcl',
]);

export interface IndexedFile {
  filePath: string;
  relativePath: string;
  content: string;
  sizeBytes: number;
}

async function walkDirectory(dir: string, baseDir: string, files: IndexedFile[]): Promise<void> {
  if (files.length >= config.limits.maxFilesPerScan) return;

  let entries: import('fs').Dirent[] = [];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as import('fs').Dirent[];
  } catch {
    return;
  }

  for (const entry of entries) {
    if (files.length >= config.limits.maxFilesPerScan) break;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      await walkDirectory(fullPath, baseDir, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      try {
        const stat = await fs.stat(fullPath);
        // Skip files over 500KB
        if (stat.size > 500 * 1024) continue;

        const content = await fs.readFile(fullPath, 'utf-8');
        files.push({
          filePath: fullPath,
          relativePath,
          content,
          sizeBytes: stat.size,
        });
      } catch (err) {
        logger.warn(`Could not read file: ${fullPath}`, err);
      }
    }
  }
}

export async function indexRepository(repoDir: string): Promise<IndexedFile[]> {
  const files: IndexedFile[] = [];
  await walkDirectory(repoDir, repoDir, files);
  logger.info(`Indexed ${files.length} files from ${repoDir}`);
  return files;
}
