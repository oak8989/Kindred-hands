import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import Layout from '../components/Layout';
import { QrCode, CheckCircle, XCircle, UserCheck } from 'lucide-react';

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const type = searchParams.get('type') as 'checkin' | 'checkout' | null;
  const eventId = searchParams.get('event');
  const { currentUser, checkIn, checkOut, qrTokens, attendance, events, users, settings } = useStore();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [walkinEventId, setWalkinEventId] = useState('');
  const [walkinUserId, setWalkinUserId] = useState('');
  const [staffMode, setStaffMode] = useState(false);

  // Auto-process QR token from URL
  useEffect(() => {
    if (token && type && eventId && currentUser) {
      processToken(token, type, eventId);
    }
  }, [token, type, eventId]);

  const processToken = (tkn: string, actionType: 'checkin' | 'checkout', evtId: string) => {
    const qrToken = qrTokens.find(t => t.token === tkn);
    if (!qrToken) { setMessage('Invalid QR code.'); setSuccess(false); return; }
    if (qrToken.used) { setMessage('This QR code has already been used.'); setSuccess(false); return; }
    if (new Date(qrToken.expiresAt) < new Date()) { setMessage('This QR code has expired.'); setSuccess(false); return; }

    let result;
    if (actionType === 'checkin') {
      result = checkIn(evtId, 'qr');
    } else {
      result = checkOut(evtId, 'qr');
    }
    setMessage(result.message);
    setSuccess(result.success);
  };

  const handleWalkin = (action: 'checkin' | 'checkout') => {
    if (!walkinEventId) { setMessage('Please select an event.'); return; }
    const userId = staffMode && walkinUserId ? walkinUserId : undefined;
    const result = action === 'checkin' ? checkIn(walkinEventId, 'walkin', userId) : checkOut(walkinEventId, 'walkin', userId);
    setMessage(result.message);
    setSuccess(result.success);
  };

  const handleStaffAssist = (action: 'checkin' | 'checkout') => {
    if (!walkinEventId || !walkinUserId) { setMessage('Please select an event and member.'); return; }
    const result = action === 'checkin' ? checkIn(walkinEventId, 'staff', walkinUserId) : checkOut(walkinEventId, 'staff', walkinUserId);
    setMessage(result.message);
    setSuccess(result.success);
  };

  const upcomingEvents = events.filter(e => new Date(e.startTime) >= new Date(Date.now() - 86400000));

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Check In / Check Out</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Check-in */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" style={{ color: settings.primaryColor }} /> QR Code Check-in
          </h2>
          <p className="text-gray-600 text-sm mb-4">Scan the QR code provided by event staff to check in or check out. If you were directed here via a QR code link, the action has been processed automatically.</p>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Point your camera at the event QR code</p>
            {token && <p className="text-xs text-gray-400 mt-2">Token: {token.substring(0, 8)}...</p>}
          </div>
        </div>

        {/* Walk-in / Staff-assisted */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" style={{ color: settings.primaryColor }} /> Walk-in / Staff Check-in
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select value={walkinEventId} onChange={e => setWalkinEventId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Select event...</option>
                {upcomingEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>

            {(currentUser?.role === 'admin' || currentUser?.role === 'assistant') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member (for staff-assisted)</label>
                <select value={walkinUserId} onChange={e => setWalkinUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select member...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => walkinUserId ? handleStaffAssist('checkin') : handleWalkin('checkin')}
                className="py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                Check In
              </button>
              <button onClick={() => walkinUserId ? handleStaffAssist('checkout') : handleWalkin('checkout')}
                className="py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition">
                Check Out
              </button>
            </div>
          </div>

          {/* Active check-ins for this event */}
          {walkinEventId && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Currently checked in:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {attendance.filter(a => a.eventId === walkinEventId && !a.checkOutTime).map(a => {
                  const user = users.find(u => u.id === a.userId);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-green-50 px-3 py-1.5 rounded">
                      <span className="text-gray-700">{user?.name || 'Unknown'}</span>
                      <span className="text-gray-500 text-xs">{new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
