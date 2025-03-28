/**
 * Support Types
 * 
 * This file contains all support and ticket-related type definitions.
 */

import { BaseEntity } from './common';

// Support ticket status and priority
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Support ticket interface
export interface SupportTicket extends BaseEntity {
  user_id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  resolved_at: string | null;
}

// Support message interface
export interface SupportMessage extends BaseEntity {
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_path: string | null;
} 