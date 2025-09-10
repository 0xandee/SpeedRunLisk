# SEA Campaign Database Migration Guide

This document outlines the database migration process for the Speedrun Lisk Campaign implementation.

## Migration Overview

The SEA campaign requires several database changes:

1. **New enum types** for submission status, reward types, and payment status
2. **Extended users table** with country and SEA campaign fields
3. **Extended user_challenges table** with campaign-specific fields
4. **Three new tables** for campaign data management
5. **New challenge records** for the 6 SEA campaign challenges

## Running the Migration

### Option 1: Using Drizzle Kit (Recommended)

Since the schema has already been updated in `schema.ts`, use Drizzle Kit to generate and apply migrations:

```bash
cd packages/nextjs

# Generate migration from schema changes
yarn drizzle-kit generate

# Apply the migration to database
yarn drizzle-kit migrate
```

### Option 2: Manual Migration

If you need to apply the migration manually, you can use the SQL file:

```bash
# Connect to your PostgreSQL database and run:
psql -d your_database -f services/database/migrations/0012_sea_campaign_tables.sql
```

## New Database Tables

### 1. `sea_campaign_submissions`

Stores individual weekly challenge submissions with all required metadata.

**Key fields:**

-   `user_address` - Links to users table
-   `week_number` - Which week (1-6)
-   `github_url` - Required GitHub repository
-   `social_post_url` - Required social media post
-   `review_status` - Submission review status
-   `completion_bonus_amount` - Any bonus earned

### 2. `sea_campaign_progress`

Tracks overall user progress through the 6-week campaign.

**Key fields:**

-   `week_1_completed` through `week_6_completed` - Individual week status
-   `total_weeks_completed` - Count of completed weeks
-   `is_graduated` - True when all 6 weeks complete
-   `total_bonus_earned` - Total bonus amount

### 3. `sea_campaign_rewards`

Records bonus rewards distributed to top performers.

**Key fields:**

-   `reward_type` - TOP_QUALITY, TOP_ENGAGEMENT, FAST_COMPLETION
-   `reward_amount` - Bonus amount in USD
-   `payment_status` - PENDING, PAID, FAILED
-   `payment_tx_hash` - On-chain payment transaction

## Schema Changes to Existing Tables

### Users Table Extensions

-   `country` - User's country (for SEA targeting)
-   `sea_campaign_participant` - Participation flag
-   `sea_campaign_registration_date` - When they joined

### User Challenges Table Extensions

-   `campaign_id` - Links to specific campaign
-   `week_number` - Week number for campaign challenges
-   `social_post_url` - Social media requirement
-   `mentor_assigned` - Assigned mentor address
-   `completion_time_hours` - Time taken to complete

## New Challenge Records

The migration adds 6 new challenge records:

-   `sea-week-1-hello-token-nft`
-   `sea-week-2-frontend-connect`
-   `sea-week-3-indexing-display`
-   `sea-week-4-oracle-sponsored`
-   `sea-week-5-nft-badge-game`
-   `sea-week-6-mini-dex-lending`

## Performance Considerations

The migration includes several indexes for optimal query performance:

-   Weekly submission lookups
-   User progress tracking
-   Reward distribution queries
-   Status-based filtering

## Data Validation

After migration, verify:

1. **New tables exist** with proper schema
2. **Existing data** is preserved in users and user_challenges
3. **New challenge records** are available
4. **Indexes** are created for performance

```sql
-- Verify new tables
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'sea_campaign_%';

-- Check new challenge records
SELECT id, challenge_name FROM challenges
WHERE id LIKE 'sea-week-%';

-- Validate indexes
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'sea_campaign_%';
```

## Rollback Plan

If rollback is needed:

```sql
-- Drop new tables (will cascade)
DROP TABLE sea_campaign_rewards;
DROP TABLE sea_campaign_progress;
DROP TABLE sea_campaign_submissions;

-- Drop new enums
DROP TYPE sea_campaign_payment_status_enum;
DROP TYPE sea_campaign_reward_type_enum;
DROP TYPE sea_campaign_submission_status_enum;

-- Remove new columns from existing tables
ALTER TABLE users
DROP COLUMN country,
DROP COLUMN sea_campaign_participant,
DROP COLUMN sea_campaign_registration_date;

ALTER TABLE user_challenges
DROP COLUMN campaign_id,
DROP COLUMN week_number,
DROP COLUMN social_post_url,
DROP COLUMN mentor_assigned,
DROP COLUMN completion_time_hours;

-- Remove challenge records
DELETE FROM challenges WHERE id LIKE 'sea-week-%';
```

## Environment Variables

Ensure these environment variables are set for the migration:

```env
POSTGRES_URL=your_database_connection_string
```

## Post-Migration Tasks

After successful migration:

1. **Seed test data** if needed for development
2. **Update API documentation** with new endpoints
3. **Run integration tests** to verify functionality
4. **Deploy frontend changes** that use the new schema
5. **Set up monitoring** for campaign metrics

## Troubleshooting

### Common Issues

1. **Permission errors**: Ensure database user has CREATE permissions
2. **Enum conflicts**: If enums already exist, drop and recreate
3. **Foreign key violations**: Ensure users table has required addresses
4. **Index conflicts**: Drop existing conflicting indexes first

### Verification Queries

```sql
-- Check table row counts
SELECT 'sea_campaign_submissions' as table, count(*) as rows FROM sea_campaign_submissions
UNION ALL
SELECT 'sea_campaign_progress', count(*) FROM sea_campaign_progress
UNION ALL
SELECT 'sea_campaign_rewards', count(*) FROM sea_campaign_rewards;

-- Verify schema structure
\d sea_campaign_submissions
\d sea_campaign_progress
\d sea_campaign_rewards
```

This migration enables the full SEA Campaign functionality including submission tracking, progress monitoring, and automated reward distribution.
