# DrasticDigital Client Portal Overview

This document provides a comprehensive overview of the DrasticDigital client portal codebase to facilitate migration to a Vercel app.

## Table of Contents
- [Project Structure](#project-structure)
- [Core Functionality](#core-functionality)
- [UI Components](#ui-components)
- [Pages](#pages)
- [Integration Points](#integration-points)
- [Migration Strategy](#migration-strategy)

## Project Structure

The current codebase consists of several HTML files, each representing a different page in the client portal:

- `dashboard.html` - The main dashboard overview page
- `my_info.html` - User profile information
- `support.html` - Support ticket system
- `billing.html` - Billing and payment management
- `Business_Info.html` - Business information page
- `formnew.html` - Form submission page
- `management.html` - Project management page
- `web_design.html` - Web design services page
- `reference.html` - Reference information page

## Core Functionality

The client portal provides the following core functionality:

1. **Dashboard Overview**: Shows key metrics, statistics, and project information
2. **Client Profile Management**: Allows clients to view and update their profile information
3. **Support Ticket System**: Enables clients to create and track support tickets
4. **Billing Management**: Provides access to billing history, invoices, and payment methods
5. **Project Management**: Allows clients to view and manage project-related information
6. **File Access**: Provides access to project files (integration with Google Drive)

## UI Components

The UI follows a consistent design pattern with these common components:

### Layout Components
- **Dashboard Container**: Main wrapper for all pages
- **Dashboard Header**: Title and action items (search, balance, travel mode)
- **Cards**: Content blocks with consistent styling

### Common UI Elements
- **Buttons**: Primary, info, danger styles
- **Form Fields**: Inputs, selects, textareas with consistent styling
- **Status Badges**: Visual indicators for different statuses (paid, pending, overdue, etc.)
- **Tables**: For displaying tabular data
- **Tabs**: For organizing content into sections

### Responsive Design
- The UI is designed to be responsive with breakpoints at:
  - 1200px (large screens)
  - 992px (medium screens)
  - 768px (tablets)
  - 640px (small tablets)
  - 480px (mobile phones)

## Pages

### Dashboard (dashboard.html)
- **Purpose**: Main landing page showing an overview of client information
- **Key Components**:
  - Stats cards (Total Sales, New Leads, Projects)
  - Recent Transactions table
  - Quick access links to key services (WordPress Admin, Lead Dashboard)
  - Project Files access (integrated with Google Drive)
- **Integration Points**:
  - Google Drive folder link retrieval from client data

### Client Profile (my_info.html)
- **Purpose**: Displays and allows editing of client information
- **Key Components**:
  - Profile header with client details
  - Tabs for different sections (My Links, My Billing, Support History)
  - Quick access links
- **Integration Points**:
  - Client data retrieval and update

### Support System (support.html)
- **Purpose**: Allows clients to create and track support tickets
- **Key Components**:
  - Support ticket form
  - Support ticket history table
  - FAQ section
- **Integration Points**:
  - Ticket submission and retrieval

### Billing (billing.html)
- **Purpose**: Manages billing information and invoices
- **Key Components**:
  - Plan details and usage
  - Payment method information
  - Invoice history table
- **Integration Points**:
  - Invoice retrieval
  - Payment method management

## Integration Points

The current implementation has several integration points with external systems:

1. **Client Data**: Retrieval of client information (name, email, phone, etc.)
2. **Google Drive**: Integration for project file access
   ```
   // Example from dashboard.html
   driveFolderLink = Clients[Email == zoho.loginuserid].Drive_Folder_Link;
   if(driveFolderLink != null && driveFolderLink.trim() != "" && driveFolderLink.trim().toLowerCase() != "null")
   {
     if(driveFolderLink.contains("embeddedfolderview?id="))
     {
       folderId = driveFolderLink.getSuffix("embeddedfolderview?id=");
       driveFolderLink = "https://drive.google.com/drive/folders/" + folderId;
     }
   }
   ```
3. **Support Ticket System**: Submission and tracking of support tickets
4. **Billing System**: Management of billing plans, payment methods, and invoices

## Migration Strategy

To migrate this application to a Vercel app, consider the following approach:

### 1. Technology Stack
- **Framework**: Next.js (works well with Vercel)
- **UI Library**: React with styled-components or Tailwind CSS
- **Authentication**: Next-Auth or similar
- **API**: Next.js API routes for backend functionality
- **Database**: Serverless database like Supabase or Vercel Postgres

### 2. Component Structure
- Create reusable React components for common UI elements
- Implement layout components
- Use CSS-in-JS or Tailwind for styling

### 3. Page Structure
- Convert each HTML file to a Next.js page
- Implement dynamic routing for authenticated routes

### 4. Data Integration
- Replace Zoho integrations with Next.js API routes
- Implement Google Drive API integration for file access
- Create database schema to store client information

### 5. Authentication
- Implement user authentication and authorization
- Set up secure routes

### 6. Deployment
- Deploy to Vercel
- Set up environment variables for API keys and secrets
- Configure custom domain

### 7. Testing
- Implement testing for critical functionality
- Perform cross-browser and responsive testing

## CSS Design System

The current application uses a consistent design system with the following characteristics:

### Colors
- Primary text: #333
- Secondary text: #666
- Light background: #fff
- Light border: #eee, #ddd
- Primary accent: #3b82f6 (blue)
- Success: #059669 (green)
- Warning: #f59e0b (yellow)
- Danger: #dc2626 (red)

### Typography
- Font family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif
- Base font size: 14px-16px
- Heading sizes: 24px (h1), 20px (h2), 16px (h3)

### Spacing
- Container padding: 24px
- Card padding: 24px
- Gap between elements: 16px-24px
- Form field gap: 8px

### Borders & Shadows
- Border radius: 6px-12px
- Border color: #eee, #ddd
- Box shadow: 0 1px 3px rgba(0,0,0,0.1)

## Conclusion

This document provides a comprehensive overview of the DrasticDigital client portal application. Use this as a reference when rebuilding the application as a Vercel app. The existing HTML/CSS implementation provides a solid foundation for the UI design and functionality requirements. 