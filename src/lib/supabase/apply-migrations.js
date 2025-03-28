#!/usr/bin/env node

/**
 * Simple script to apply migrations to Supabase
 * Run it with: node apply-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL using Supabase
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error(`Error running migration ${path.basename(filePath)}:`, error);
      return false;
    }
    
    console.log(`Successfully applied migration: ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`Error processing migration ${path.basename(filePath)}:`, err);
    return false;
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Apply in alphabetical order
    
    console.log(`Found ${files.length} migration files to apply.`);
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const success = await runMigration(filePath);
      
      if (!success) {
        console.error(`Migration failed: ${file}`);
        process.exit(1);
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Error reading migrations directory:', err);
    process.exit(1);
  }
}

applyMigrations().catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
}); 