import { useState, useEffect } from 'react';
import { useStore } from '../store';
import Layout from '../components/Layout';
import { Users, Calendar, FileText, Award, Settings, Download, Plus, Edit, Trash2, Mail, Shield, BarChart3 } from 'lucide-react';
import type { User, Event, Medal } from '../types';

type Tab = 'members' | 'events' | 'attendance' | 'waivers' | 'medals' | 'settings' | 'email';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const { currentUser } = useStore();
  if (!currentUser) return null;

  const tabs: { id: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: BarChart3 },
    { id: 'waivers', label: 'Waivers', icon: FileText },
    { id: 'medals', label: 'Medals', icon: Award },
    { id: 'email', label: 'Email Log', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const filteredTabs = tabs.filter(t => !t.adminOnly || currentUser.role === 'admin');

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Administration</h1>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {filteredTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeTab === tab.id ? { backgroundColor: useStore.getState().settings.primaryColor } : {}}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'events' && <EventsTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'waivers' && <WaiversTab />}
      {activeTab === 'medals' && <MedalsTab />}
      {activeTab === 'email' && <EmailTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </Layout>
  );
}

function MembersTab() {
  const { users, updateUserRole, attendance, settings } = useStore();
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Total Hours', 'Events Attended', 'Joined'];
    const rows = users.map(u => {
      const userAttendance = attendance.filter(a => a.userId === u.id);
      const hours = userAttendance.reduce((sum, a) => sum + (a.hours || 0), 0);
      const events = new Set(userAttendance.map(a => a.eventId)).size;
      return [u.name, u.email, u.role, hours.toFixed(1), events, new Date(u.createdAt).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    downloadFile(csv, 'members.csv', 'text/csv');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const hours = attendance.filter(a => a.userId === user.id).reduce((s, a) => s + (a.hours || 0), 0);
                return (
                  <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <select value={user.role} onChange={e => updateUserRole(user.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border rounded capitalize" disabled={user.role === 'admin'}>
                        <option value="member">Member</option>
                        <option value="assistant">Assistant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{hours.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <button className="text-indigo-600 hover:text-indigo-800 text-xs">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EventsTab() {
  const { events, createEvent, updateEvent, deleteEvent, registrations, settings } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', location: '', startTime: '', endTime: '',
    capacity: 50, isPublic: true, isRecurring: false, recurrencePattern: 'weekly' as const, recurrenceEndDate: '', timezone: 'America/New_York',
  });

  const handleSubmit = () => {
    if (!form.title || !form.startTime || !form.endTime) return;
    if (editingId) {
      updateEvent(editingId, form);
    } else {
      createEvent({ ...form, createdBy: useStore.getState().currentUser?.id || '' });
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', description: '', location: '', startTime: '', endTime: '', capacity: 50, isPublic: true, isRecurring: false, recurrencePattern: 'weekly', recurrenceEndDate: '', timezone: 'America/New_York' });
  };

  const startEdit = (event: any) => {
    setForm({ title: event.title, description: event.description, location: event.location, startTime: event.startTime, endTime: event.endTime, capacity: event.capacity, isPublic: event.isPublic, isRecurring: event.isRecurring, recurrencePattern: event.recurrencePattern || 'weekly', recurrenceEndDate: event.recurrenceEndDate || '', timezone: event.timezone });
    setEditingId(event.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{events.length} events total</p>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Event' : 'Create Event'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
                <span className="text-sm">Public Event</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} className="rounded" />
                <span className="text-sm">Recurring</span>
              </label>
            </div>
            {form.isRecurring && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                  <select value={form.recurrencePattern} onChange={e => setForm({ ...form, recurrencePattern: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence End Date</label>
                  <input type="date" value={form.recurrenceEndDate} onChange={e => setForm({ ...form, recurrenceEndDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>{editingId ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(event => {
              const regCount = registrations.filter(r => r.eventId === event.id && r.status === 'registered').length;
              return (
                <tr key={event.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {event.title}
                    {event.isRecurring && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">↻</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(event.startTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{event.location}</td>
                  <td className="px-4 py-3 text-gray-600">{regCount}/{event.capacity}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(event)} className="text-indigo-600 hover:text-indigo-800"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Delete this event?')) deleteEvent(event.id); }} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceTab() {
  const { attendance, events, users } = useStore();

  const exportCSV = () => {
    const headers = ['Member', 'Event', 'Check In', 'Check Out', 'Hours', 'Method', 'Verified'];
    const rows = attendance.map(a => {
      const user = users.find(u => u.id === a.userId);
      const event = events.find(e => e.id === a.eventId);
      return [user?.name || '', event?.title || '', new Date(a.checkInTime).toLocaleString(), a.checkOutTime ? new Date(a.checkOutTime).toLocaleString() : '', (a.hours || 0).toFixed(2), a.method, a.verified ? 'Yes' : 'No'];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    downloadFile(csv, 'attendance.csv', 'text/csv');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{attendance.length} records</p>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice().reverse().map(record => {
                const user = users.find(u => u.id === record.userId);
                const event = events.find(e => e.id === record.eventId);
                return (
                  <tr key={record.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-500">{event?.title || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(record.checkInTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{record.hours?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 capitalize">{record.method}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WaiversTab() {
  const { waivers, createWaiver, waiverSignatures, users, settings } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!title || !content) return;
    createWaiver(title, content);
    setTitle(''); setContent(''); setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{waivers.length} waiver versions</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
          <Plus className="w-4 h-4" /> New Waiver Version
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Waiver Version</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: settings.primaryColor }}>Create</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {waivers.map(waiver => {
          const signatures = waiverSignatures.filter(s => s.waiverId === waiver.id);
          return (
            <div key={waiver.id} className={`bg-white rounded-xl shadow-sm border p-5 ${waiver.isActive ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{waiver.title}</h3>
                <div className="flex items-center gap-2">
                  {waiver.isActive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                  <span className="text-xs text-gray-500">v{waiver.version}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-2">{new Date(waiver.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{waiver.content}</p>
              <p className="text-xs text-gray-400 mt-2">{signatures.length} signatures collected</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MedalsTab() {
  const { medals, createMedal, awardMedal, users, attendance, settings } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏅', threshold: 10, type: 'hours' as 'hours' | 'events' });
  const [awardTo, setAwardTo] = useState({ medalId: '', userId: '' });

  const handleCreate = () => {
    if (!form.name) return;
    createMedal(form);
    setForm({ name: '', description: '', icon: '🏅', threshold: 10, type: 'hours' });
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{medals.length} medals defined</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
          <Plus className="w-4 h-4" /> Create Medal
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Medal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="hours">Hours</option>
                <option value="events">Events</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
              <input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: settings.primaryColor }}>Create</button>
          </div>
        </div>
      )}

      {/* Award Medal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Manually Award Medal</h3>
        <div className="flex flex-wrap gap-3">
          <select value={awardTo.medalId} onChange={e => setAwardTo({ ...awardTo, medalId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select medal...</option>
            {medals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={awardTo.userId} onChange={e => setAwardTo({ ...awardTo, userId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select member...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={() => { if (awardTo.medalId && awardTo.userId) awardMedal(awardTo.medalId, awardTo.userId); }}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">Award</button>
        </div>
      </div>

      {/* Medals List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medals.map(medal => (
          <div key={medal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{medal.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{medal.name}</h3>
                <p className="text-xs text-gray-500">{medal.threshold} {medal.type}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{medal.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailTab() {
  const { emailLogs, settings, sendEmail, currentUser } = useStore();
  const [testSent, setTestSent] = useState(false);
  const [testTo, setTestTo] = useState(currentUser?.email || '');

  const handleSendTest = () => {
    if (!testTo) return;
    sendEmail(testTo, 'Test Email from ' + settings.name, 'This is a test email sent from the Kindred Hands admin panel. If you receive this, your email configuration is working correctly.');
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div>
      {/* Email Configuration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Email Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Mode:</span>{' '}
            <span className="font-medium capitalize">{settings.emailMode}</span>
          </div>
          {settings.emailMode === 'smtp' && (
            <>
              <div>
                <span className="text-gray-500">Host:</span>{' '}
                <span className="font-medium">{settings.smtpHost || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Port:</span>{' '}
                <span className="font-medium">{settings.smtpPort || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">From:</span>{' '}
                <span className="font-medium">{settings.smtpFromAddress || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Encryption:</span>{' '}
                <span className="font-medium">{settings.smtpEncryption || 'Not set'}</span>
              </div>
            </>
          )}
        </div>
        {settings.emailMode === 'console' && (
          <p className="text-xs text-gray-500 mt-3">
            Console mode: Emails are logged to the browser console. Open DevTools (F12) → Console tab to view emails.
          </p>
        )}
      </div>

      {/* Send Test Email */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Send Test Email</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="email" 
            value={testTo} 
            onChange={e => setTestTo(e.target.value)} 
            placeholder="recipient@example.com" 
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
          />
          <button 
            onClick={handleSendTest} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition whitespace-nowrap"
          >
            {testSent ? '✓ Sent!' : 'Send Test'}
          </button>
        </div>
        {testSent && (
          <p className="text-sm text-green-600 mt-2">
            Test email sent! {settings.emailMode === 'console' ? 'Check browser console (F12) for the email content.' : 'Check the email log below.'}
          </p>
        )}
      </div>

      {/* Email Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Email Log ({emailLogs.length} emails)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.slice().reverse().map(log => (
                <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{log.to}</td>
                  <td className="px-4 py-3 text-gray-600">{log.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.sentAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{log.status}</span></td>
                </tr>
              ))}
              {emailLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No emails sent yet. Send a test email or register a user to see emails here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSettings, sendEmail, currentUser } = useStore();
  const [form, setForm] = useState({
    name: settings.name,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    timezone: settings.timezone,
    emailMode: settings.emailMode,
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || 587,
    smtpEncryption: settings.smtpEncryption || 'starttls',
    smtpUsername: settings.smtpUsername || '',
    smtpPassword: settings.smtpPassword || '',
    smtpFromAddress: settings.smtpFromAddress || '',
  });
  const [saved, setSaved] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  // Update form when settings change
  useEffect(() => {
    setForm({
      name: settings.name,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      timezone: settings.timezone,
      emailMode: settings.emailMode,
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || 587,
      smtpEncryption: settings.smtpEncryption || 'starttls',
      smtpUsername: settings.smtpUsername || '',
      smtpPassword: settings.smtpPassword || '',
      smtpFromAddress: settings.smtpFromAddress || '',
    });
  }, [settings]);

  const handleSave = () => {
    const updates: any = {
      name: form.name,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      timezone: form.timezone,
      emailMode: form.emailMode,
    };

    if (form.emailMode === 'smtp') {
      updates.smtpHost = form.smtpHost;
      updates.smtpPort = form.smtpPort;
      updates.smtpEncryption = form.smtpEncryption;
      updates.smtpUsername = form.smtpUsername;
      updates.smtpPassword = form.smtpPassword;
      updates.smtpFromAddress = form.smtpFromAddress;
    }

    updateSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestEmail = () => {
    const testEmail = currentUser?.email || 'test@example.com';
    sendEmail(testEmail, 'Test Email from ' + form.name, 'This is a test email to verify your email configuration is working correctly.');
    setTestEmailSent(true);
    setTimeout(() => setTestEmailSent(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Organization Settings</h3>
        
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✓ Settings saved successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
              <input type="text" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
              <input type="text" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Berlin">Berlin</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Mode</label>
          <select value={form.emailMode} onChange={e => setForm({ ...form, emailMode: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="console">Console (logs to browser console)</option>
            <option value="file">File (logs to file)</option>
            <option value="smtp">SMTP (real email server)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {form.emailMode === 'console' && 'Emails will be logged to the browser console. Open DevTools (F12) to view.'}
            {form.emailMode === 'file' && 'Emails will be saved to files on the server.'}
            {form.emailMode === 'smtp' && 'Emails will be sent via SMTP server. Configure settings below.'}
          </p>
        </div>
        
        {form.emailMode === 'smtp' && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">SMTP Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input type="text" value={form.smtpHost} onChange={e => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input type="number" value={form.smtpPort} onChange={e => setForm({ ...form, smtpPort: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
              <select value={form.smtpEncryption} onChange={e => setForm({ ...form, smtpEncryption: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="starttls">STARTTLS</option>
                <option value="tls">TLS/SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={form.smtpUsername} onChange={e => setForm({ ...form, smtpUsername: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.smtpPassword} onChange={e => setForm({ ...form, smtpPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
              <input type="email" value={form.smtpFromAddress} onChange={e => setForm({ ...form, smtpFromAddress: e.target.value })} placeholder="noreply@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button onClick={handleSave} className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>
            Save Settings
          </button>
          <button onClick={handleTestEmail} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
            {testEmailSent ? '✓ Test email sent!' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
