import { VirtualFile, FileSystemNode, CodebaseStats } from "../types";

/**
 * Builds a hierarchical FileSystemNode structure from a flat array of VirtualFile objects
 */
export function buildFileTree(files: VirtualFile[]): FileSystemNode {
  const root: FileSystemNode = {
    name: "Root",
    path: "",
    type: "directory",
    children: {},
    isOpen: true,
  };

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentNode = root;

    parts.forEach((part, index) => {
      if (!part) return; // Skip empty segments (e.g. leading slashes)
      
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!currentNode.children) {
        currentNode.children = {};
      }

      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "directory",
          isOpen: false, // Default closed
        };

        if (isLast) {
          currentNode.children[part].fileData = file;
        } else {
          currentNode.children[part].children = {};
        }
      }

      currentNode = currentNode.children[part];
    });
  });

  return root;
}

/**
 * Pretty-formats file sizes
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Analyzes file contents inside a codebase to generate metrics
 */
export function calculateCodebaseStats(files: VirtualFile[]): CodebaseStats {
  let totalFiles = files.length;
  let totalBytes = 0;
  let totalLines = 0;
  const extensionCounts: { [ext: string]: number } = {};
  const dependencySet = new Set<string>();

  files.forEach((file) => {
    totalBytes += file.size;
    
    // Count lines of code
    const lines = file.content.split(/\r\n|\r|\n/).length;
    totalLines += lines;

    // Extension breakdown
    const ext = file.extension.toLowerCase() || "no-extension";
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;

    // Detect typical JavaScript / TypeScript / Python dependencies
    if (["js", "jsx", "ts", "tsx"].includes(ext)) {
      const importRegex = /(?:import\s+.*\s+from\s+['"]([^'"]+)['"])|(?:require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const dep = match[1] || match[2];
        if (dep && !dep.startsWith(".") && !dep.startsWith("/") && !dep.startsWith("@/")) {
          // Keep only first level block package or library name
          const baseDep = dep.split("/")[0];
          dependencySet.add(baseDep);
        }
      }
    } else if (ext === "py") {
      const pyRegex = /(?:import\s+([a-zA-Z0-9_]+))|(?:from\s+([a-zA-Z0-9_]+)\s+import)/g;
      let match;
      while ((match = pyRegex.exec(file.content)) !== null) {
        const dep = match[1] || match[2];
        if (dep && !["sys", "os", "time", "math", "typing", "json"].includes(dep)) {
          dependencySet.add(dep);
        }
      }
    } else if (file.name === "package.json") {
      try {
        const parsed = JSON.parse(file.content);
        const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
        Object.keys(deps).forEach((d) => dependencySet.add(d));
      } catch (e) {
        // Suppress invalid JSON parsing errors
      }
    } else if (file.name === "requirements.txt") {
      file.content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const dep = trimmed.split(/[=<>~]/)[0];
          if (dep) dependencySet.add(dep.trim());
        }
      });
    }
  });

  // Calculate top 5 largest files
  const sortedFiles = [...files]
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((f) => ({ path: f.path, size: f.size }));

  return {
    totalFiles,
    totalLines,
    totalBytes,
    extensionCounts,
    largestFiles: sortedFiles,
    detectedDependencies: Array.from(dependencySet).slice(0, 15),
  };
}
