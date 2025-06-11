#!/usr/bin/env node

/**
 * This script checks if all required environment variables are set
 * and provides guidance on how to set them up.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// List of required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

// Check if all required variables are set
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set.');
  process.exit(0);
}

console.log('\n❌ Missing environment variables:');
missingVars.forEach(varName => {
  console.log(`   - ${varName}`);
});

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.log('\n⚠️ No .env.local file found.');
  console.log('   Create a .env.local file in the project root with the following content:');
} else {
  console.log('\n⚠️ Update your .env.local file with the following missing variables:');
}

// Show template for missing variables
console.log('\n# Supabase environment variables');
missingVars.forEach(varName => {
  console.log(`${varName}=your_${varName.toLowerCase()}_here`);
});

console.log('\n📋 How to get these values:');
console.log('   1. Go to https://supabase.com and sign in to your account');
console.log('   2. Open your project');
console.log('   3. Go to Project Settings > API');
console.log('   4. Copy the values from there (Project URL, anon public, service_role key)');
console.log('\n⚠️ IMPORTANT: After updating .env.local, restart your Next.js server');

process.exit(1); 