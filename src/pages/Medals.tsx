import { useStore } from '../store';
import Layout from '../components/Layout';
import { Award, Trophy, Star } from 'lucide-react';

export default function Medals() {
  const { currentUser, medals, medalAwards, attendance, settings } = useStore();
  if (!currentUser) return null;

  const myAwards = medalAwards.filter(a => a.userId === currentUser.id);
  const myAttendance = attendance.filter(a => a.userId === currentUser.id && a.verified);
  const totalHours = myAttendance.reduce((sum, a) => sum + (a.hours || 0), 0);
  const uniqueEvents = new Set(myAttendance.map(a => a.eventId)).size;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Medals</h1>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <Trophy className="w-12 h-12 opacity-80" />
          <div>
            <p className="text-3xl font-bold">{myAwards.length}</p>
            <p className="opacity-80">Medals Earned</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
            <p className="text-xs opacity-80">Hours</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{uniqueEvents}</p>
            <p className="text-xs opacity-80">Events</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{myAttendance.length}</p>
            <p className="text-xs opacity-80">Check-ins</p>
          </div>
        </div>
      </div>

      {/* Medals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medals.map(medal => {
          const awarded = myAwards.find(a => a.medalId === medal.id);
          let progress = 0;
          let current = 0;
          if (medal.type === 'hours') { progress = Math.min((totalHours / medal.threshold) * 100, 100); current = totalHours; }
          if (medal.type === 'events') { progress = Math.min((uniqueEvents / medal.threshold) * 100, 100); current = uniqueEvents; }

          return (
            <div key={medal.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition ${
              awarded ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'
            }`}>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl ${
                  awarded ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {medal.icon}
                </div>
                <h3 className="font-bold text-gray-900">{medal.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{medal.description}</p>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: awarded ? '#EAB308' : settings.primaryColor }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {awarded ? (
                      <span className="text-yellow-600 font-medium flex items-center justify-center gap-1"><Star className="w-3 h-3" /> Earned on {new Date(awarded.awardedAt).toLocaleDateString()}</span>
                    ) : (
                      <span>{current.toFixed(medal.type === 'hours' ? 1 : 0)} / {medal.threshold} {medal.type}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {medals.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No medals defined yet. Ask your administrator to create some!</p>
        </div>
      )}
    </Layout>
  );
}
