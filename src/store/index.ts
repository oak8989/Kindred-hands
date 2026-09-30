import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User, Event, Registration, Attendance, Waiver, WaiverSignature, Medal, MedalAward, OrganizationSettings, QRToken, EmailLog } from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  resetTokens: Map<string, { userId: string; expiresAt: string; used: boolean }>;
  
  // Events
  events: Event[];
  registrations: Registration[];
  
  // Attendance
  attendance: Attendance[];
  qrTokens: QRToken[];
  
  // Waivers
  waivers: Waiver[];
  waiverSignatures: WaiverSignature[];
  
  // Medals
  medals: Medal[];
  medalAwards: MedalAward[];
  
  // Organization
  settings: OrganizationSettings;
  
  // Email
  emailLogs: EmailLog[];
  
  // Actions
  login: (email: string, password: string) => { success: boolean; message: string; user?: User };
  logout: () => void;
  register: (email: string, name: string) => { success: boolean; message: string; tempPassword?: string };
  setPassword: (userId: string, newPassword: string) => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string; token?: string };
  resetPassword: (token: string, newPassword: string) => { success: boolean; message: string };
  
  // Events
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  cancelOccurrence: (eventId: string, date: string) => void;
  
  // Registrations
  registerForEvent: (eventId: string) => { success: boolean; message: string };
  cancelRegistration: (eventId: string) => void;
  
  // Attendance
  checkIn: (eventId: string, method: 'qr' | 'staff' | 'walkin', userId?: string) => { success: boolean; message: string };
  checkOut: (eventId: string, method: 'qr' | 'staff' | 'walkin', userId?: string) => { success: boolean; message: string };
  generateQRToken: (eventId: string, type: 'checkin' | 'checkout') => string;
  
  // Waivers
  createWaiver: (title: string, content: string) => void;
  signWaiver: (waiverId: string, signatureData: string) => void;
  
  // Medals
  createMedal: (medal: Omit<Medal, 'id' | 'createdAt'>) => void;
  awardMedal: (medalId: string, userId: string) => void;
  checkMedalEligibility: (userId: string) => Medal[];
  
  // Settings
  updateSettings: (updates: Partial<OrganizationSettings>) => void;
  completeSetup: () => void;
  
  // Email
  sendEmail: (to: string, subject: string, body: string) => void;
  
  // Users
  updateUserRole: (userId: string, role: User['role']) => void;
}

// Simple hash for demo (in production, use bcrypt on server)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hashed_' + Math.abs(hash).toString(36) + '_' + password.length;
};

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      resetTokens: new Map(),
      events: [],
      registrations: [],
      attendance: [],
      qrTokens: [],
      waivers: [],
      waiverSignatures: [],
      medals: [],
      medalAwards: [],
      settings: {
        name: '',
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED',
        timezone: 'America/New_York',
        emailMode: 'console',
        isSetupComplete: false,
      },
      emailLogs: [],

      login: (email, password) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          return { success: false, message: 'If an account exists with that email, you will receive instructions.' };
        }
        if (user.passwordHash !== hashPassword(password)) {
          return { success: false, message: 'If an account exists with that email, you will receive instructions.' };
        }
        set({ currentUser: { ...user, lastLogin: new Date().toISOString() } });
        return { success: true, message: 'Login successful', user };
      },

      logout: () => set({ currentUser: null }),

      register: (email, name) => {
        const existing = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          // Generic response - don't reveal account exists
          get().sendEmail(email, 'Account Setup', 'If you requested an account, please follow the link to set up your password.');
          return { success: true, message: 'If this email is not already registered, you will receive setup instructions.' };
        }
        const tempPassword = generateTempPassword();
        const newUser: User = {
          id: uuidv4(),
          email,
          name,
          role: 'member',
          passwordHash: hashPassword(tempPassword),
          mustResetPassword: true,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, newUser] }));
        get().sendEmail(email, 'Welcome to ' + get().settings.name, `Your temporary password is: ${tempPassword}\nPlease change it on first login.`);
        return { success: true, message: 'If this email is not already registered, you will receive setup instructions.', tempPassword };
      },

      setPassword: (userId, newPassword) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, passwordHash: hashPassword(newPassword), mustResetPassword: false } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, passwordHash: hashPassword(newPassword), mustResetPassword: false } : state.currentUser,
        }));
      },

      requestPasswordReset: (email) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        // Generic response
        if (!user) {
          return { success: true, message: 'If an account exists with that email, you will receive reset instructions.' };
        }
        const token = uuidv4();
        const resetTokens = new Map(get().resetTokens);
        resetTokens.set(token, { userId: user.id, expiresAt: new Date(Date.now() + 3600000).toISOString(), used: false });
        set({ resetTokens });
        const resetLink = `${window.location.origin}/reset-password?token=${token}`;
        get().sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}\nThis link expires in 1 hour.`);
        return { success: true, message: 'If an account exists with that email, you will receive reset instructions.', token };
      },

      resetPassword: (token, newPassword) => {
        const resetData = get().resetTokens.get(token);
        if (!resetData) return { success: false, message: 'Invalid or expired reset link.' };
        if (resetData.used) return { success: false, message: 'This reset link has already been used.' };
        if (new Date(resetData.expiresAt) < new Date()) return { success: false, message: 'This reset link has expired.' };
        
        set(state => ({
          users: state.users.map(u => u.id === resetData.userId ? { ...u, passwordHash: hashPassword(newPassword) } : u),
          resetTokens: new Map([...state.resetTokens].map(([k, v]) => [k, k === token ? { ...v, used: true } : v])),
        }));
        return { success: true, message: 'Password has been reset successfully.' };
      },

      createEvent: (event) => {
        const newEvent: Event = { ...event, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ events: [...state.events, newEvent] }));
      },

      updateEvent: (id, updates) => {
        set(state => ({
          events: state.events.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e),
        }));
      },

      deleteEvent: (id) => {
        set(state => ({
          events: state.events.filter(e => e.id !== id),
          registrations: state.registrations.filter(r => r.eventId !== id),
        }));
      },

      cancelOccurrence: (eventId, date) => {
        set(state => ({
          events: state.events.map(e => e.id === eventId ? { ...e, cancelledOccurrences: [...(e.cancelledOccurrences || []), date] } : e),
        }));
      },

      registerForEvent: (eventId) => {
        const user = get().currentUser;
        if (!user) return { success: false, message: 'Please log in to register.' };
        const event = get().events.find(e => e.id === eventId);
        if (!event) return { success: false, message: 'Event not found.' };
        
        const existingReg = get().registrations.find(r => r.eventId === eventId && r.userId === user.id && r.status === 'registered');
        if (existingReg) return { success: false, message: 'Already registered for this event.' };
        
        const currentRegs = get().registrations.filter(r => r.eventId === eventId && r.status === 'registered').length;
        if (currentRegs >= event.capacity) return { success: false, message: 'Event is at capacity.' };
        
        const registration: Registration = {
          id: uuidv4(),
          eventId,
          userId: user.id,
          status: 'registered',
          createdAt: new Date().toISOString(),
        };
        set(state => ({ registrations: [...state.registrations, registration] }));
        get().sendEmail(user.email, `Registered: ${event.title}`, `You are registered for ${event.title} on ${new Date(event.startTime).toLocaleString()}.`);
        return { success: true, message: 'Successfully registered!' };
      },

      cancelRegistration: (eventId) => {
        const user = get().currentUser;
        if (!user) return;
        set(state => ({
          registrations: state.registrations.map(r => r.eventId === eventId && r.userId === user.id ? { ...r, status: 'cancelled' as const } : r),
        }));
      },

      checkIn: (eventId, method, userId) => {
        const uid = userId || get().currentUser?.id;
        if (!uid) return { success: false, message: 'No user specified.' };
        
        const existing = get().attendance.find(a => a.eventId === eventId && a.userId === uid && !a.checkOutTime);
        if (existing) return { success: false, message: 'Already checked in.' };
        
        const record: Attendance = {
          id: uuidv4(),
          eventId,
          userId: uid,
          checkInTime: new Date().toISOString(),
          method,
          verified: method === 'qr',
        };
        set(state => ({ attendance: [...state.attendance, record] }));
        return { success: true, message: 'Checked in successfully!' };
      },

      checkOut: (eventId, method, userId) => {
        const uid = userId || get().currentUser?.id;
        if (!uid) return { success: false, message: 'No user specified.' };
        
        const record = get().attendance.find(a => a.eventId === eventId && a.userId === uid && !a.checkOutTime);
        if (!record) return { success: false, message: 'No active check-in found.' };
        
        const checkOutTime = new Date().toISOString();
        const hours = (new Date(checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 3600000;
        
        set(state => ({
          attendance: state.attendance.map(a => a.id === record.id ? { ...a, checkOutTime, hours: Math.round(hours * 100) / 100, verified: true } : a),
        }));
        return { success: true, message: 'Checked out successfully!' };
      },

      generateQRToken: (eventId, type) => {
        const token = uuidv4();
        const qrToken: QRToken = {
          token,
          eventId,
          type,
          expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes
          used: false,
        };
        set(state => ({ qrTokens: [...state.qrTokens, qrToken] }));
        return token;
      },

      createWaiver: (title, content) => {
        const currentVersion = get().waivers.length > 0 ? Math.max(...get().waivers.map(w => w.version)) : 0;
        const waiver: Waiver = {
          id: uuidv4(),
          title,
          content,
          version: currentVersion + 1,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        set(state => ({
          waivers: [...state.waivers.map(w => ({ ...w, isActive: false })), waiver],
        }));
      },

      signWaiver: (waiverId, signatureData) => {
        const user = get().currentUser;
        if (!user) return;
        const waiver = get().waivers.find(w => w.id === waiverId);
        if (!waiver) return;
        
        const signature: WaiverSignature = {
          id: uuidv4(),
          waiverId,
          userId: user.id,
          signatureData,
          signedAt: new Date().toISOString(),
          waiverVersion: waiver.version,
        };
        set(state => ({ waiverSignatures: [...state.waiverSignatures, signature] }));
      },

      createMedal: (medal) => {
        const newMedal: Medal = { ...medal, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ medals: [...state.medals, newMedal] }));
      },

      awardMedal: (medalId, userId) => {
        const existing = get().medalAwards.find(a => a.medalId === medalId && a.userId === userId);
        if (existing) return;
        const award: MedalAward = { id: uuidv4(), medalId, userId, awardedAt: new Date().toISOString() };
        set(state => ({ medalAwards: [...state.medalAwards, award] }));
      },

      checkMedalEligibility: (userId) => {
        const userAttendance = get().attendance.filter(a => a.userId === userId && a.verified);
        const totalHours = userAttendance.reduce((sum, a) => sum + (a.hours || 0), 0);
        const uniqueEvents = new Set(userAttendance.map(a => a.eventId)).size;
        
        return get().medals.filter(m => {
          const alreadyAwarded = get().medalAwards.find(a => a.medalId === m.id && a.userId === userId);
          if (alreadyAwarded) return false;
          if (m.type === 'hours') return totalHours >= m.threshold;
          if (m.type === 'events') return uniqueEvents >= m.threshold;
          return false;
        });
      },

      updateSettings: (updates) => {
        set(state => ({ settings: { ...state.settings, ...updates } }));
      },

      completeSetup: () => {
        set(state => ({ settings: { ...state.settings, isSetupComplete: true } }));
      },

      sendEmail: (to, subject, body) => {
        const log: EmailLog = {
          id: uuidv4(),
          to,
          subject,
          body,
          sentAt: new Date().toISOString(),
          status: 'sent',
        };
        set(state => ({ emailLogs: [...state.emailLogs, log] }));
        console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
      },

      updateUserRole: (userId, role) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role } : u),
        }));
      },
    }),
    {
      name: 'kindred-hands-storage',
    }
  )
);
