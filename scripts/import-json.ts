#!/usr/bin/env node

/**
 * Script for importing JSON data from various sources and standardizing it
 * 
 * Usage:
 *   npm run import-json -- --file=path/to/file.json --url=https://original-source.com
 *   npm run import-json -- --url=https://json-data-source.com --source=https://original-source.com
 */

import { importJsonFile, importJsonFromUrl } from '../src/utils/import-json';
import path from 'path';
import fs from 'fs/promises';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (value) {
      acc[key] = value;
    } else {
      acc[key] = true;
    }
  }
  return acc;
}, {} as Record<string, string | boolean>);

async function run() {
  try {
    // Show help if requested or no arguments provided
    if (args.help || Object.keys(args).length === 0) {
      printHelp();
      return;
    }

    // Import from file
    if (args.file) {
      const filePath = args.file as string;
      const sourceUrl = args.url as string || 'https://unknown-source.com';
      const outputName = args.output as string;

      console.log(`Importing from file: ${filePath}`);
      console.log(`Source URL: ${sourceUrl}`);

      const savedPath = await importJsonFile(filePath, sourceUrl, outputName);
      console.log(`Successfully imported and standardized to: ${savedPath}`);
    }
    // Import from URL
    else if (args.url) {
      const jsonUrl = args.url as string;
      const sourceUrl = args.source as string || jsonUrl;
      const outputName = args.output as string;

      console.log(`Importing from URL: ${jsonUrl}`);
      console.log(`Source URL: ${sourceUrl}`);

      const savedPath = await importJsonFromUrl(jsonUrl, sourceUrl, outputName);
      console.log(`Successfully imported and standardized to: ${savedPath}`);
    } 
    else {
      console.error('Error: Missing required arguments. Use --help for usage information.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Import JSON Utility

This script imports concert data from a file or URL and standardizes it to our format.

Usage:
  npm run import-json -- [options]

Options:
  --file=<path>      Path to a local JSON file to import
  --url=<url>        URL of a JSON resource to import
  --source=<url>     Original source URL (used with --url, defaults to the same as --url)
  --output=<name>    Custom filename for the output file
  --help             Show this help information

Examples:
  npm run import-json -- --file=./data/concerts.json --url=https://venue.com
  npm run import-json -- --url=https://api.venue.com/events --source=https://venue.com
  `);
}

// Add this script to package.json
async function setupPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts['import-json']) {
      packageJson.scripts['import-json'] = 'ts-node ./scripts/import-json.ts';
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
      console.log('Added import-json script to package.json');
    }
  } catch (error) {
    console.warn('Could not set up package.json script:', error);
  }
}

// Check if this file is being executed directly
if (require.main === module) {
  // Setup package.json if needed
  setupPackageJson().catch(console.error);
  
  // Run the import process
  run().catch(console.error);
} 