import { google } from 'googleapis';

// Initialize Google Drive API client with service account
export function initDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

// Find a client folder by email
export async function findClientFolder(drive: any, clientEmail: string) {
  console.log(`Finding best matching folder for: ${clientEmail}`);
  
  // First strategy: Try exact match
  try {
    console.log('Strategy 1: Exact match search');
    const exactMatchQuery = `mimeType = 'application/vnd.google-apps.folder' and name contains '${clientEmail}' and trashed = false`;
    console.log('Exact match query:', exactMatchQuery);
    
    const exactMatchResponse = await drive.files.list({
      q: exactMatchQuery,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    
    console.log(`Exact match found ${exactMatchResponse.data.files.length} folders`);
    
    if (exactMatchResponse.data.files.length > 0) {
      console.log('Exact matches:', exactMatchResponse.data.files.map((f: any) => f.name).join(', '));
      return exactMatchResponse.data.files[0];
    }
  } catch (error) {
    console.error('Error in exact match search:', error);
  }
  
  // Second strategy: Try domain part of email
  try {
    const emailParts = clientEmail.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      console.log('Strategy 2: Domain search for', domain);
      
      const domainQuery = `mimeType = 'application/vnd.google-apps.folder' and name contains '${domain}' and trashed = false`;
      const domainResponse = await drive.files.list({
        q: domainQuery,
        fields: 'files(id, name)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      });
      
      console.log(`Domain search found ${domainResponse.data.files.length} folders`);
      
      if (domainResponse.data.files.length > 0) {
        console.log('Domain matches:', domainResponse.data.files.map((f: any) => f.name).join(', '));
        return domainResponse.data.files[0];
      }
    }
  } catch (error) {
    console.error('Error in domain search:', error);
  }
  
  // Third strategy: Try username part of email
  try {
    const emailParts = clientEmail.split('@');
    if (emailParts.length === 2) {
      const username = emailParts[0];
      console.log('Strategy 3: Username search for', username);
      
      const usernameQuery = `mimeType = 'application/vnd.google-apps.folder' and name contains '${username}' and trashed = false`;
      const usernameResponse = await drive.files.list({
        q: usernameQuery,
        fields: 'files(id, name)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      });
      
      console.log(`Username search found ${usernameResponse.data.files.length} folders`);
      
      if (usernameResponse.data.files.length > 0) {
        console.log('Username matches:', usernameResponse.data.files.map((f: any) => f.name).join(', '));
        return usernameResponse.data.files[0];
      }
    }
  } catch (error) {
    console.error('Error in username search:', error);
  }
  
  console.log('No matching folder found for:', clientEmail);
  return null;
} 