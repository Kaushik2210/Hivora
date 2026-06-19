import fs from 'fs';
import path from 'path';

export interface ScannedSymbol {
  name: string;
  type: 'function' | 'class' | 'const';
  line: number;
}

export interface ScannedFile {
  file: string;
  symbols: ScannedSymbol[];
}

function scanFile(filePath: string): ScannedSymbol[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const symbols: ScannedSymbol[] = [];

    const functionRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/;
    const constRegex = /export\s+const\s+([a-zA-Z0-9_]+)/;
    const classRegex = /export\s+class\s+([a-zA-Z0-9_]+)/;

    lines.forEach((line, index) => {
      let match = line.match(functionRegex);
      if (match) {
        symbols.push({ name: match[1], type: 'function', line: index + 1 });
        return;
      }
      match = line.match(constRegex);
      if (match) {
        symbols.push({ name: match[1], type: 'const', line: index + 1 });
        return;
      }
      match = line.match(classRegex);
      if (match) {
        symbols.push({ name: match[1], type: 'class', line: index + 1 });
        return;
      }
    });

    return symbols;
  } catch (err) {
    console.error('Failed to read file', filePath, err);
    return [];
  }
}

export function scanDirectory(dir: string): ScannedFile[] {
  let results: ScannedFile[] = [];
  
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(scanDirectory(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const symbols = scanFile(filePath);
      if (symbols.length > 0) {
        results.push({
          file: filePath,
          symbols,
        });
      }
    }
  }

  return results;
}
