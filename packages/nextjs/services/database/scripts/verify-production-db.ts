#!/usr/bin/env tsx

/**
 * Production Database Verification Script
 *
 * This script verifies that the production database is properly configured
 * and all necessary tables exist with the correct schema.
 *
 * Usage:
 *   yarn tsx services/database/scripts/verify-production-db.ts
 */
import { getDb } from "../config/postgresClient";
import * as schema from "../config/schema";

const REQUIRED_TABLES = ["users", "challenges", "builds", "user_challenges", "activities", "batches"];

async function verifyDatabase() {
  console.log("🔍 Verifying production database configuration...\n");

  try {
    // Check environment variables
    console.log("1. Checking environment variables...");
    if (!process.env.POSTGRES_URL) {
      throw new Error("❌ POSTGRES_URL environment variable is not set");
    }

    if (!process.env.POSTGRES_URL.includes("neon")) {
      console.log("⚠️  Warning: Not using Neon database. Make sure this is intended.");
    }

    console.log("✅ Environment variables OK\n");

    // Test database connection
    console.log("2. Testing database connection...");
    const db = getDb();

    // Simple connection test
    const result = await db.execute("SELECT 1 as test");
    const resultArray = Array.isArray(result) ? result : result.rows || [];
    if (!result || resultArray.length === 0) {
      throw new Error("❌ Database connection test failed");
    }
    console.log("✅ Database connection OK\n");

    // Check if tables exist
    console.log("3. Checking required tables...");
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tables = await db.execute(tableCheckQuery);
    const tablesArray = Array.isArray(tables) ? tables : tables.rows || [];
    const existingTables = tablesArray.map((row: any) => row.table_name);

    console.log(`Found ${existingTables.length} tables: ${existingTables.join(", ")}`);

    const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log(`❌ Missing required tables: ${missingTables.join(", ")}`);
      console.log("💡 Run 'yarn drizzle-kit migrate' to create missing tables");
      process.exit(1);
    }

    console.log("✅ All required tables exist\n");

    // Check table schemas (basic validation)
    console.log("4. Validating table schemas...");

    for (const tableName of REQUIRED_TABLES) {
      const columnQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public'
      `;

      const columns = await db.execute(columnQuery);
      const columnsArray = Array.isArray(columns) ? columns : columns.rows || [];
      if (columnsArray.length === 0) {
        throw new Error(`❌ Table ${tableName} has no columns`);
      }

      console.log(`✅ ${tableName}: ${columnsArray.length} columns`);
    }

    console.log("\n5. Testing basic operations...");

    // Test read operation
    try {
      const challengeCount = await db.execute("SELECT COUNT(*) as count FROM challenges");
      const challengeCountArray = Array.isArray(challengeCount) ? challengeCount : challengeCount.rows || [];
      console.log(`✅ Read test: Found ${challengeCountArray[0]?.count || 0} challenges`);
    } catch (error) {
      console.log(`❌ Read test failed: ${error}`);
      throw error;
    }

    // Test user table structure
    try {
      const userColumns = await db.execute(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        AND column_name IN ('id', 'address', 'created_at')
      `);

      const userColumnsArray = Array.isArray(userColumns) ? userColumns : userColumns.rows || [];
      if (userColumnsArray.length < 3) {
        throw new Error("Users table missing required columns");
      }
      console.log("✅ Users table structure OK");
    } catch (error) {
      console.log(`❌ Users table validation failed: ${error}`);
      throw error;
    }

    console.log("\n🎉 Database verification completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   • Database URL: ${process.env.POSTGRES_URL?.split("@")[1] || "Hidden"}`);
    console.log(`   • Tables verified: ${REQUIRED_TABLES.length}`);
    console.log(`   • Connection: ✅ Working`);
    console.log(`   • Schema: ✅ Valid`);
    console.log("\n🚀 Your database is ready for production!");
  } catch (error) {
    console.error("\n❌ Database verification failed:");
    console.error(error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("   1. Verify POSTGRES_URL is correctly set");
    console.log("   2. Check if database migrations have been run");
    console.log("   3. Ensure database is accessible from your current location");
    console.log("   4. Run 'yarn drizzle-kit migrate' if tables are missing");
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  verifyDatabase().catch(console.error);
}

export { verifyDatabase };
