# Week 3: Indexing & Display

## Challenge Overview

Index blockchain data from your contracts and display it in your frontend with pagination and filtering.

## Key Requirements

- Set up event indexing (using The Graph or custom solution)
- Display transaction history and events
- Implement pagination for large datasets
- Add filtering and search functionality
- Real-time updates when new events occur

## Learning Objectives

- Blockchain data indexing concepts
- Event listening and processing
- Efficient data display patterns
- Real-time web applications
- Database design for blockchain data

## Technical Approaches

### Option 1: The Graph Protocol

- Create subgraph for your contracts
- Query indexed data with GraphQL
- Real-time subscriptions

### Option 2: Custom Indexer

- Listen to contract events directly
- Store in local database (PostgreSQL/MongoDB)
- Create API endpoints for frontend

### Option 3: Third-party APIs

- Use Moralis, Alchemy, or similar
- Focus on frontend implementation
- Faster setup but less customization

## Submission Requirements

- ✅ Working demo with indexed data
- ✅ Pagination (handle 100+ records)
- ✅ At least 2 filter/search options
- ✅ Real-time updates (bonus points)
- ✅ GitHub repository with documentation

## Success Tips

- Start with simple event indexing
- Focus on user experience for data display
- Handle loading states gracefully
- Consider mobile responsiveness
- Document your indexing strategy

**Due Date**: October 5, 2025
