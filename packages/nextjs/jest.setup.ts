// Jest setup file
import { config } from 'dotenv';

// Load environment variables from .env.local for testing
config({ path: '.env.local' });

// Mock Next.js modules that are not available in Node.js environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Set up test database environment variables
process.env.NODE_ENV = 'test';
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://test:test@localhost:5432/speedrun_lisk_test';

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};