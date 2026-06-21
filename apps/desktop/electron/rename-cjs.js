#!/usr/bin/env node
// Rename main.js to main.cjs after TypeScript compilation
const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../dist-electron/main.js');
const mainCjsPath = path.join(__dirname, '../dist-electron/main.cjs');

if (fs.existsSync(mainJsPath)) {
  fs.renameSync(mainJsPath, mainCjsPath);
  console.log('✓ Renamed main.js to main.cjs');
}

// Also rename preload if it exists (compiled from .cts)
const preloadJsPath = path.join(__dirname, '../dist-electron/preload.js');
const preloadCjsPath = path.join(__dirname, '../dist-electron/preload.cjs');

if (fs.existsSync(preloadJsPath)) {
  fs.renameSync(preloadJsPath, preloadCjsPath);
  console.log('✓ Renamed preload.js to preload.cjs');
}

// Always copy the source preload.cjs — TypeScript doesn't process .cjs files
// so we must manually sync the source to dist-electron/
const preloadSrcPath = path.join(__dirname, 'preload.cjs');
if (fs.existsSync(preloadSrcPath)) {
  fs.copyFileSync(preloadSrcPath, preloadCjsPath);
  console.log('✓ Copied preload.cjs to dist-electron/');
}
