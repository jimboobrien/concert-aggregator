#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'crud-config.json');
const migrationsDir = path.resolve(process.cwd(), 'src/utils/supabase/migrations');
const adminAppDir = path.resolve(process.cwd(), 'src/app/admin');
const apiDir = path.resolve(process.cwd(), 'src/app/api');

// Helper to create directories if they don't exist
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// --- Template Generators ---

const migrationTemplate = (tableName) => `
-- Migration for creating the ${tableName} table
CREATE TABLE ${tableName} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Policies will be based on crud-config.json
-- Example policies:
-- CREATE POLICY "Allow public read access" ON ${tableName} FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated users to insert" ON ${tableName} FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow owners to update" ON ${tableName} FOR UPDATE USING (auth.uid() = owner_id);
`;

const pageTemplate = (tableName) => `
import React from 'react';

export default function ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}ListPage() {
  return (
    <div className="container mt-4">
      <h1>${tableName.charAt(0).toUpperCase() + tableName.slice(1)} List</h1>
      <p>This is where the list of ${tableName} will be displayed.</p>
      {/* Add table or list component here */}
    </div>
  );
}
`;

const createPageTemplate = (tableName) => `
import React from 'react';

export default function Create${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Page() {
  return (
    <div className="container mt-4">
      <h1>Create New ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}</h1>
      <p>This is the form to create a new item in ${tableName}.</p>
      {/* Add form component here */}
    </div>
  );
}
`;

const editPageTemplate = (tableName) => `
import React from 'react';

export default function Edit${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Page({ params }: { params: { id: string } }) {
  return (
    <div className="container mt-4">
      <h1>Edit ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}: {params.id}</h1>
      <p>This is the form to edit an item in ${tableName}.</p>
      {/* Add form component here */}
    </div>
  );
}
`;

const apiRouteTemplate = (tableName) => `
import { NextResponse } from 'next/server';

// This is a placeholder.
// You would implement proper logic here to interact with your database
// and enforce role-based access control based on crud-config.json.

export async function GET(request: Request) {
  return NextResponse.json({ message: 'GET request for ${tableName}' });
}

export async function POST(request: Request) {
  return NextResponse.json({ message: 'POST request for ${tableName}' });
}
`;

// --- Main Script Logic ---

async function scaffold() {
  console.log('Starting CRUD scaffolding script...');

  // Ensure base directories exist
  ensureDirExists(migrationsDir);
  ensureDirExists(adminAppDir);
  ensureDirExists(apiDir);

  let config;
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(rawConfig);
  } catch (error) {
    console.error('Error reading or parsing crud-config.json:', error);
    process.exit(1);
  }

  for (const table of config) {
    const { table_name } = table;
    console.log(`\nProcessing table: ${table_name}...`);

    // --- 1. Scaffold Migration File ---
    const migrationFileName = `${new Date().getTime()}_create_table_${table_name}.sql`;
    const migrationFilePath = path.join(migrationsDir, migrationFileName);
    const migrationExists = fs.readdirSync(migrationsDir).some(file => file.includes(`_create_table_${table_name}.sql`));

    if (!migrationExists) {
      fs.writeFileSync(migrationFilePath, migrationTemplate(table_name));
      console.log(` ✓ Created migration file: ${migrationFileName}`);
    } else {
      console.log(` - Migration for ${table_name} already exists. Skipping.`);
    }

    // --- 2. Scaffold Admin CRUD Interface ---
    const tableAdminDir = path.join(adminAppDir, table_name);
    if (!fs.existsSync(tableAdminDir)) {
      ensureDirExists(tableAdminDir);

      fs.writeFileSync(path.join(tableAdminDir, 'page.tsx'), pageTemplate(table_name));

      const createPageDir = path.join(tableAdminDir, 'create');
      ensureDirExists(createPageDir);
      fs.writeFileSync(path.join(createPageDir, 'page.tsx'), createPageTemplate(table_name));

      const editPageDir = path.join(tableAdminDir, '[id]', 'edit');
      ensureDirExists(editPageDir);
      fs.writeFileSync(path.join(editPageDir, 'page.tsx'), editPageTemplate(table_name));
      
      console.log(` ✓ Created admin UI directory and files for ${table_name}`);
    } else {
      console.log(` - Admin UI for ${table_name} already exists. Skipping.`);
    }

    // --- 3. Scaffold API Routes ---
    const tableApiDir = path.join(apiDir, table_name);
    if (!fs.existsSync(tableApiDir)) {
       ensureDirExists(tableApiDir);
       fs.writeFileSync(path.join(tableApiDir, 'route.ts'), apiRouteTemplate(table_name));
       console.log(` ✓ Created API route directory and file for ${table_name}`);
    } else {
       console.log(` - API route for ${table_name} already exists. Skipping.`);
    }
  }

  console.log('\nScaffolding script finished.');
}

scaffold(); 