#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please add them to your .env.local file and try again.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for user email
async function promptForEmail() {
  return new Promise((resolve) => {
    rl.question('Enter the email of the user to assign admin role: ', (email) => {
      resolve(email);
    });
  });
}

// Confirm assignment
async function confirmAssignment(email) {
  return new Promise((resolve) => {
    rl.question(`Are you sure you want to assign admin role to ${email}? (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  try {
    console.log('=== Assign Admin Role ===');
    
    // Get user email
    const userEmail = await promptForEmail();
    
    // Find user by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error fetching users: ${userError.message}`);
    }
    
    const matchingUser = user.users.find(u => u.email === userEmail);
    
    if (!matchingUser) {
      throw new Error(`No user found with email: ${userEmail}`);
    }
    
    // Confirm assignment
    const confirmed = await confirmAssignment(userEmail);
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      process.exit(0);
    }
    
    // Check if user already has a role
    const { data: existingRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', matchingUser.id)
      .single();
    
    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Error checking existing role: ${roleError.message}`);
    }
    
    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', matchingUser.id);
      
      if (updateError) {
        throw new Error(`Error updating role: ${updateError.message}`);
      }
      
      console.log(`Updated role for ${userEmail} to admin (previous role: ${existingRole.role})`);
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: matchingUser.id, role: 'admin' });
      
      if (insertError) {
        throw new Error(`Error inserting role: ${insertError.message}`);
      }
      
      console.log(`Assigned admin role to ${userEmail}`);
    }
    
    console.log('Operation completed successfully.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 