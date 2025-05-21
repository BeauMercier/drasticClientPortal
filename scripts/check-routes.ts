import * as fs from 'fs';
import * as path from 'path';

const apiDir = path.join(__dirname, '../src/app/api');
const apiDocsPath = path.join(__dirname, '../docs/api.md');

function getDirectories(source: string): string[] {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

function parseApiDocs(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const routes: string[] = [];
  for (const line of lines) {
    if (line.startsWith('- /api/')) {
      routes.push(line.substring(2).trim()); // Gets '/api/routeName'
    }
  }
  return routes;
}

console.log('Checking API route documentation against actual routes...');

let actualRouteDirs;
try {
  actualRouteDirs = getDirectories(apiDir);
} catch (error) {
  console.error(`Error reading API directories from ${apiDir}:`, error);
  process.exit(1);
}

const actualRoutes = actualRouteDirs.map(dir => `/api/${dir}`);
actualRoutes.sort();

console.log('Actual routes found in src/app/api/:', actualRoutes);

let documentedRoutes;
try {
  documentedRoutes = parseApiDocs(apiDocsPath);
} catch (error) {
  console.error(`Error reading or parsing API documentation from ${apiDocsPath}:`, error);
  process.exit(1);
}

documentedRoutes.sort();
console.log('Documented routes found in docs/api.md:', documentedRoutes);

const actualSet = new Set(actualRoutes);
const documentedSet = new Set(documentedRoutes);

let allMatch = true;

for (const route of actualRoutes) {
  if (!documentedSet.has(route)) {
    console.error(`❌ ERROR: Actual route ${route} is MISSING from docs/api.md`);
    allMatch = false;
  }
}

for (const route of documentedRoutes) {
  if (!actualSet.has(route)) {
    console.error(`❌ ERROR: Documented route ${route} in docs/api.md does NOT EXIST in src/app/api/`);
    allMatch = false;
  }
}

if (allMatch) {
  console.log('✅ Success! API routes in src/app/api/ match docs/api.md.');
  process.exit(0);
} else {
  console.error(' discrepancies found. Please update docs/api.md or src/app/api/ structure.');
  process.exit(1);
} 