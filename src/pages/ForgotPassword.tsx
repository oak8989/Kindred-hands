import { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const { requestPasswordReset, settings } = useStore();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = requestPasswordReset(email);
    setMessage(result.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: settings.primaryColor + '20' }}>
            <KeyRound className="w-8 h-8" style={{ color: settings.primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-1">Enter your email to receive reset instructions</p>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
            <p className="text-blue-700 text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <button type="submit" className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>
            Send Reset Link
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
