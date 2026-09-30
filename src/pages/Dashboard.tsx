import { useStore } from '../store';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, Clock, Award, Users, TrendingUp, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, events, registrations, attendance, medals, medalAwards, settings } = useStore();
  if (!currentUser) return null;

  const myRegistrations = registrations.filter(r => r.userId === currentUser.id && r.status === 'registered');
  const myAttendance = attendance.filter(a => a.userId === currentUser.id);
  const totalHours = myAttendance.reduce((sum, a) => sum + (a.hours || 0), 0);
  const myMedals = medalAwards.filter(a => a.userId === currentUser.id);
  const upcomingEvents = events.filter(e => new Date(e.startTime) > new Date()).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser.name}!</h1>
        <p className="text-gray-600 mt-1">Here's your volunteer overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.primaryColor + '20' }}>
              <Calendar className="w-5 h-5" style={{ color: settings.primaryColor }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myRegistrations.length}</p>
              <p className="text-sm text-gray-500">Upcoming Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Total Hours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myMedals.length}</p>
              <p className="text-sm text-gray-500">Medals Earned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myAttendance.length}</p>
              <p className="text-sm text-gray-500">Events Attended</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            ) : upcomingEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="block p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-400">{event.location}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-4 space-y-3">
            {myAttendance.slice(-5).reverse().map(record => {
              const event = events.find(e => e.id === record.eventId);
              return (
                <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event?.title || 'Unknown Event'}</p>
                    <p className="text-xs text-gray-500">{new Date(record.checkInTime).toLocaleDateString()} • {record.hours?.toFixed(1) || '0'} hours</p>
                  </div>
                </div>
              );
            })}
            {myAttendance.length === 0 && (
              <p className="text-gray-500 text-center py-4">No activity yet. Register for an event to get started!</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
