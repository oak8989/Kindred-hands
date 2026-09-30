import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import Layout from '../components/Layout';
import { Calendar, MapPin, Users, Clock, ArrowLeft, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, registrations, currentUser, registerForEvent, cancelRegistration, attendance, generateQRToken, settings } = useStore();
  const [qrUrl, setQrUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const event = events.find(e => e.id === id);
  if (!event || !currentUser) return <Layout><p>Event not found</p></Layout>;

  const myReg = registrations.find(r => r.eventId === id && r.userId === currentUser.id && r.status === 'registered');
  const myAttendance = attendance.find(a => a.eventId === id && a.userId === currentUser.id);
  const regCount = registrations.filter(r => r.eventId === id && r.status === 'registered').length;

  const handleRegister = () => {
    const result = registerForEvent(event.id);
    if (!result.success) alert(result.message);
  };

  const handleCancel = () => {
    if (confirm('Cancel your registration?')) cancelRegistration(event.id);
  };

  const handleGenerateQR = async (type: 'checkin' | 'checkout') => {
    const token = generateQRToken(event.id, type);
    const url = `${window.location.origin}/checkin?token=${token}&type=${type}&event=${event.id}`;
    const qrDataUrl = await QRCode.toDataURL(url);
    setQrUrl(qrDataUrl);
    setShowQR(true);
  };

  return (
    <Layout>
      <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-3" style={{ backgroundColor: settings.primaryColor }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  {event.isRecurring && <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Recurring ({event.recurrencePattern})</span>}
                  {!event.isPublic && <span className="inline-block mt-1 ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Private</span>}
                </div>
              </div>
              <p className="text-gray-600 mb-6">{event.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">{new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p className="font-medium text-gray-900">{new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium text-gray-900">{regCount}/{event.capacity} registered</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {!myReg && !myAttendance && (
                  <button onClick={handleRegister} className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>
                    Register for Event
                  </button>
                )}
                {myReg && (
                  <button onClick={handleCancel} className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition">
                    Cancel Registration
                  </button>
                )}
                {(currentUser.role === 'admin' || currentUser.role === 'assistant') && (
                  <>
                    <button onClick={() => handleGenerateQR('checkin')} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition flex items-center gap-2">
                      <QrCode className="w-4 h-4" /> Check-in QR
                    </button>
                    <button onClick={() => handleGenerateQR('checkout')} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition flex items-center gap-2">
                      <QrCode className="w-4 h-4" /> Check-out QR
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Your Status</h3>
            {myReg && <p className="text-green-600 font-medium">✓ Registered</p>}
            {myAttendance && (
              <div>
                <p className="text-green-600 font-medium">✓ Attended</p>
                <p className="text-sm text-gray-500 mt-1">Hours: {myAttendance.hours?.toFixed(1) || 'In progress'}</p>
              </div>
            )}
            {!myReg && !myAttendance && <p className="text-gray-500">Not registered</p>}
          </div>

          {showQR && qrUrl && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <h3 className="font-semibold text-gray-900 mb-3">QR Code</h3>
              <img src={qrUrl} alt="QR Code" className="mx-auto w-48 h-48" />
              <p className="text-xs text-gray-500 mt-2">Valid for 5 minutes</p>
              <button onClick={() => setShowQR(false)} className="mt-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Registered Volunteers</h3>
            <div className="space-y-2">
              {registrations.filter(r => r.eventId === id && r.status === 'registered').slice(0, 10).map(r => {
                const user = useStore.getState().users.find(u => u.id === r.userId);
                return <p key={r.id} className="text-sm text-gray-600">{user?.name || 'Unknown'}</p>;
              })}
              {regCount > 10 && <p className="text-sm text-gray-400">+{regCount - 10} more</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
