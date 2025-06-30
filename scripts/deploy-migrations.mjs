#!/usr/bin/env node

/**
 * This script helps deploy migrations to a remote Supabase instance.
 * It uses the Supabase CLI to apply migrations.
 * 
 * Usage:
 * node scripts/deploy-migrations.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ensure the SUPABASE_ACCESS_TOKEN is set
if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.log('\x1b[33m%s\x1b[0m', 'Warning: SUPABASE_ACCESS_TOKEN environment variable is not set.');
  console.log('You can set it by running:');
  console.log('\x1b[36m%s\x1b[0m', 'export SUPABASE_ACCESS_TOKEN=your_token_here');
  console.log('Or you will be prompted for it during the script execution.');
}

// Function to get migration files
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'src', 'utils', 'supabase', 'migrations');
  
  try {
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(migrationsDir, file)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error reading migrations directory:', err);
    return [];
  }
}

// Function to apply migrations
async function applyMigrations(projectRef) {
  try {
    console.log('\x1b[36m%s\x1b[0m', 'Applying migrations to remote Supabase project...');
    
    // Link the project if not already linked
    try {
      execSync(`npx supabase link --project-ref ${projectRef}`, { stdio: 'inherit' });
    } catch (err) {
      console.error('Error linking project:', err);
      return false;
    }
    
    // Apply migrations
    try {
      execSync('npx supabase db push', { stdio: 'inherit' });
      return true;
    } catch (err) {
      console.error('Error applying migrations:', err);
      return false;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Main function
async function main() {
  console.log('\x1b[32m%s\x1b[0m', '=== Supabase Remote Migration Deployment ===');
  
  // List migration files
  const migrations = getMigrationFiles();
  console.log('\nMigration files to be applied:');
  migrations.forEach((migration, index) => {
    console.log(`${index + 1}. ${migration.name}`);
  });
  
  if (migrations.length === 0) {
    console.log('\x1b[31m%s\x1b[0m', 'No migration files found!');
    rl.close();
    return;
  }
  
  // Get project reference
  rl.question('\nEnter your Supabase project reference: ', async (projectRef) => {
    if (!projectRef) {
      console.log('\x1b[31m%s\x1b[0m', 'Project reference is required!');
      rl.close();
      return;
    }
    
    // Check if access token is set
    if (!process.env.SUPABASE_ACCESS_TOKEN) {
      rl.question('Enter your Supabase access token: ', async (token) => {
        if (!token) {
          console.log('\x1b[31m%s\x1b[0m', 'Access token is required!');
          rl.close();
          return;
        }
        
        process.env.SUPABASE_ACCESS_TOKEN = token;
        
        // Confirm before proceeding
        rl.question('\nDo you want to apply these migrations to your remote Supabase project? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            const success = await applyMigrations(projectRef);
            if (success) {
              console.log('\x1b[32m%s\x1b[0m', '\nMigrations applied successfully!');
            } else {
              console.log('\x1b[31m%s\x1b[0m', '\nFailed to apply migrations.');
            }
          } else {
            console.log('\nMigration cancelled.');
          }
          rl.close();
        });
      });
    } else {
      // Confirm before proceeding
      rl.question('\nDo you want to apply these migrations to your remote Supabase project? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const success = await applyMigrations(projectRef);
          if (success) {
            console.log('\x1b[32m%s\x1b[0m', '\nMigrations applied successfully!');
          } else {
            console.log('\x1b[31m%s\x1b[0m', '\nFailed to apply migrations.');
          }
        } else {
          console.log('\nMigration cancelled.');
        }
        rl.close();
      });
    }
  });
}

main(); 