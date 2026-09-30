import { useState } from 'react';
import { useStore } from '../store';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, settings } = useStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    if (password.length < 8) { setMessage('Password must be at least 8 characters.'); return; }
    const result = resetPassword(token, password);
    setMessage(result.message);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: settings.primaryColor + '20' }}>
            <Lock className="w-8 h-8" style={{ color: settings.primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
        </div>
        {message && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
}
