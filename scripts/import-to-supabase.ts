#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { DataPersistenceService } from '../src/services/data-persistence';

// Create basic CLI options parser (avoiding external dependencies)
const args = process.argv.slice(2);
const options: { 
  file?: string; 
  venueId?: string; 
  normalize?: boolean; 
  yes?: boolean 
} = {
  normalize: true
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '-f' || arg === '--file') {
    options.file = args[++i];
  } else if (arg === '-v' || arg === '--venue-id') {
    options.venueId = args[++i];
  } else if (arg === '-n' || arg === '--normalize') {
    options.normalize = args[++i] !== 'false';
  } else if (arg === '-y' || arg === '--yes') {
    options.yes = true;
  } else if (arg === '-h' || arg === '--help') {
    showHelp();
    process.exit(0);
  }
}

// Function to display help information
function showHelp() {
  console.log(`
Usage: ts-node scripts/import-to-supabase.ts [options]

Options:
  -f, --file <path>       Path to JSON file to import (required)
  -v, --venue-id <id>     Supabase venue ID to associate events with (required)
  -n, --normalize         Normalize data before inserting (default: true)
  -y, --yes               Skip confirmation prompt
  -h, --help              Show this help message
  `);
}

// Validate required options
if (!options.file) {
  console.error('Error: --file option is required');
  showHelp();
  process.exit(1);
}

if (!options.venueId) {
  console.error('Error: --venue-id option is required');
  showHelp();
  process.exit(1);
}

// Function to validate and parse JSON file
async function parseJsonFile(filePath: string) {
  try {
    const resolvedPath = path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const content = fs.readFileSync(resolvedPath, 'utf8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Error: Invalid JSON file');
    }
    throw error;
  }
}

// Main function to import data
async function importData() {
  try {
    // Parse the JSON file
    const jsonData = await parseJsonFile(options.file!);
    
    // If not using --yes flag, ask for confirmation
    if (!options.yes) {
      console.log(`
===============================
JSON Import to Supabase
===============================
File: ${options.file}
Venue ID: ${options.venueId}
Normalize data: ${options.normalize}
      `);
      
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise<void>((resolve) => {
        readline.question('Proceed with import? (y/N) ', (answer: string) => {
          readline.close();
          if (answer.toLowerCase() === 'y') {
            resolve();
          } else {
            console.log('Import cancelled');
            process.exit(0);
          }
        });
      });
    }
    
    // Create data persistence service and import the data
    const dataPersistenceService = new DataPersistenceService();
    
    console.log('Importing data to Supabase...');
    const count = await dataPersistenceService.saveJsonToSupabase(
      jsonData, 
      options.venueId!,
      options.normalize
    );
    
    console.log(`Successfully imported ${count} events to Supabase!`);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

// Execute the import
importData(); 