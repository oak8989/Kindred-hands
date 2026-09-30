import { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';

export default function Events() {
  const { events, registrations, currentUser, settings } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'registered'>('upcoming');

  if (!currentUser) return null;

  const now = new Date();
  const myRegEventIds = registrations.filter(r => r.userId === currentUser.id && r.status === 'registered').map(r => r.eventId);

  let filteredEvents = events.filter(e => {
    if (!e.isPublic && currentUser.role === 'member') return true; // Members see public + assigned
    return true;
  });

  if (search) {
    filteredEvents = filteredEvents.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase()));
  }

  if (filter === 'upcoming') filteredEvents = filteredEvents.filter(e => new Date(e.startTime) > now);
  if (filter === 'past') filteredEvents = filteredEvents.filter(e => new Date(e.startTime) <= now);
  if (filter === 'registered') filteredEvents = filteredEvents.filter(e => myRegEventIds.includes(e.id));

  filteredEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        {(currentUser.role === 'admin' || currentUser.role === 'assistant') && (
          <Link to="/admin" className="mt-2 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
            <Calendar className="w-4 h-4" /> Create Event
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-2">
          {(['upcoming', 'past', 'registered', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={filter === f ? { backgroundColor: settings.primaryColor } : {}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(event => {
          const isRegistered = myRegEventIds.includes(event.id);
          const regCount = registrations.filter(r => r.eventId === event.id && r.status === 'registered').length;
          const isCancelled = event.cancelledOccurrences?.includes(event.startTime.split('T')[0]);

          return (
            <Link key={event.id} to={`/events/${event.id}`}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition ${isCancelled ? 'opacity-60 border-red-200' : 'border-gray-100'}`}>
              <div className="h-2" style={{ backgroundColor: isCancelled ? '#EF4444' : settings.primaryColor }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
                  {event.isRecurring && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Recurring</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(event.startTime).toLocaleDateString()} • {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {regCount}/{event.capacity} registered
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {isRegistered ? (
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Registered ✓</span>
                  ) : (
                    <span className="text-sm text-gray-400">{!event.isPublic && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Private</span>}</span>
                  )}
                  {isCancelled && <span className="text-xs text-red-600 font-medium">Cancelled</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No events found</p>
        </div>
      )}
    </Layout>
  );
}
