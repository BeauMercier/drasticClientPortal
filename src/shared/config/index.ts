/**
 * Shared Configuration
 * 
 * This file exports all shared configuration from a single entry point
 */

// Default API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
};

// Application configuration
export const APP_CONFIG = {
  name: 'Drastic Client Portal',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
}; 