import { useState } from 'react';
import { useStore } from '../store';
import Layout from '../components/Layout';
import { User, Mail, Clock, Award, Calendar, Download } from 'lucide-react';

export default function Profile() {
  const { currentUser, attendance, events, medalAwards, medals, settings } = useStore();
  if (!currentUser) return null;

  const myAttendance = attendance.filter(a => a.userId === currentUser.id);
  const totalHours = myAttendance.reduce((sum, a) => sum + (a.hours || 0), 0);
  const myMedals = medalAwards.filter(a => a.userId === currentUser.id);
  const uniqueEvents = new Set(myAttendance.map(a => a.eventId)).size;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: settings.primaryColor + '20' }}>
              <span className="text-3xl font-bold" style={{ color: settings.primaryColor }}>{currentUser.name.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-gray-500">{currentUser.email}</p>
            <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full capitalize" style={{ backgroundColor: settings.primaryColor + '20', color: settings.primaryColor }}>
              {currentUser.role}
            </span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Member since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{totalHours.toFixed(1)} total hours</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medal Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Medal Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {medals.map(medal => {
                const awarded = myMedals.find(a => a.medalId === medal.id);
                let progress = 0;
                if (medal.type === 'hours') progress = Math.min((totalHours / medal.threshold) * 100, 100);
                if (medal.type === 'events') progress = Math.min((uniqueEvents / medal.threshold) * 100, 100);

                return (
                  <div key={medal.id} className={`p-4 rounded-lg border ${awarded ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{medal.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{medal.name}</p>
                        <p className="text-xs text-gray-500">{medal.description}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: awarded ? '#EAB308' : settings.primaryColor }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {awarded ? '✓ Earned!' : `${medal.type === 'hours' ? totalHours.toFixed(1) : uniqueEvents}/${medal.threshold} ${medal.type}`}
                    </p>
                  </div>
                );
              })}
              {medals.length === 0 && <p className="text-gray-500 text-sm col-span-2">No medals defined yet.</p>}
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Attendance History
              </h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Event</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Hours</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.slice().reverse().map(record => {
                    const event = events.find(e => e.id === record.eventId);
                    return (
                      <tr key={record.id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-900">{event?.title || 'Unknown'}</td>
                        <td className="py-2 text-gray-500">{new Date(record.checkInTime).toLocaleDateString()}</td>
                        <td className="py-2 text-gray-500">{record.hours?.toFixed(1) || '-'}</td>
                        <td className="py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{record.method}</span></td>
                      </tr>
                    );
                  })}
                  {myAttendance.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-500">No attendance records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
