import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, settings } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setMessage(result.message);
      setIsError(false); // Generic response - not an error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: settings.primaryColor + '20' }}>
            <LogIn className="w-8 h-8" style={{ color: settings.primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{settings.name || 'VolunteerHub'}</h1>
          <p className="text-gray-600 mt-1">Sign in to your account</p>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 block">Forgot your password?</Link>
          <p className="text-sm text-gray-600">Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}
