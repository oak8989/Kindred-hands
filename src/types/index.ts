export type Role = 'member' | 'assistant' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  mustResetPassword: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  isPublic: boolean;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string;
  cancelledOccurrences?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'cancelled' | 'attended';
  createdAt: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  hours?: number;
  method: 'qr' | 'staff' | 'walkin';
  verified: boolean;
}

export interface Waiver {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  isActive: boolean;
}

export interface WaiverSignature {
  id: string;
  waiverId: string;
  userId: string;
  signatureData: string;
  signedAt: string;
  waiverVersion: number;
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  type: 'hours' | 'events' | 'streak';
  createdAt: string;
}

export interface MedalAward {
  id: string;
  medalId: string;
  userId: string;
  awardedAt: string;
}

export interface OrganizationSettings {
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  emailMode: 'console' | 'file' | 'smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpEncryption?: 'none' | 'tls' | 'starttls';
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromAddress?: string;
  isSetupComplete: boolean;
}

export interface QRToken {
  token: string;
  eventId: string;
  type: 'checkin' | 'checkout';
  expiresAt: string;
  used: boolean;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed';
}
