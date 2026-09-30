import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Settings, Mail, User, Check, Globe, Shield } from 'lucide-react';

export default function SetupWizard() {
  const navigate = useNavigate();
  const { updateSettings, completeSetup, users, sendEmail, settings } = useStore();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED');
  const [timezone, setTimezone] = useState('America/New_York');
  const [emailMode, setEmailMode] = useState<'console' | 'file' | 'smtp'>('console');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEncryption, setSmtpEncryption] = useState<'none' | 'tls' | 'starttls'>('starttls');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [hostPort, setHostPort] = useState('3000');
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = () => {
    if (!orgName || !adminName || !adminEmail || !adminPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (adminPassword !== adminPasswordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    updateSettings({
      name: orgName,
      primaryColor,
      secondaryColor,
      timezone,
      emailMode,
      smtpHost: emailMode === 'smtp' ? smtpHost : undefined,
      smtpPort: emailMode === 'smtp' ? parseInt(smtpPort) : undefined,
      smtpEncryption: emailMode === 'smtp' ? smtpEncryption : undefined,
      smtpUsername: emailMode === 'smtp' ? smtpUsername : undefined,
      smtpPassword: emailMode === 'smtp' ? smtpPassword : undefined,
      smtpFromAddress: emailMode === 'smtp' ? smtpFrom : undefined,
    });

    // Create admin user
    useStore.getState().register(adminEmail, adminName);
    const adminUser = useStore.getState().users.find(u => u.email === adminEmail);
    if (adminUser) {
      useStore.getState().setPassword(adminUser.id, adminPassword);
      useStore.getState().updateUserRole(adminUser.id, 'admin');
    }

    completeSetup();
    navigate('/login');
  };

  const testEmail = () => {
    sendEmail(adminEmail || 'test@example.com', 'Test Email from ' + (orgName || 'VolunteerHub'), 'This is a test email to verify your email configuration.');
    setTestEmailSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to VolunteerHub</h1>
          <p className="text-gray-600 mt-2">Let's set up your volunteer tracking system</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-1 ${s < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Step 1: Port & Organization */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><Globe className="w-5 h-5" /> Network Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">Docker publishes the container port through a host port on your machine.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host Port</label>
              <input type="number" value={hostPort} onChange={e => setHostPort(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">The port accessible on your machine (e.g., 3000). The app runs on port 3000 inside the container.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="My Organization"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
            <button onClick={() => { setError(''); setStep(2); }} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
              Next: Email Configuration
            </button>
          </div>
        )}

        {/* Step 2: Email */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><Mail className="w-5 h-5" /> Email Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">Console or file mode works immediately. SMTP requires a mail server.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Delivery Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {(['console', 'file', 'smtp'] as const).map(mode => (
                  <button key={mode} onClick={() => setEmailMode(mode)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition ${
                      emailMode === mode ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {emailMode === 'smtp' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                    <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                  <select value={smtpEncryption} onChange={e => setSmtpEncryption(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="starttls">STARTTLS</option>
                    <option value="tls">TLS/SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" value={smtpUsername} onChange={e => setSmtpUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                  <input type="email" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="noreply@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            )}
            <button onClick={testEmail} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
              {testEmailSent ? '✓ Test email logged (check console)' : 'Send Test Email'}
            </button>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition">Back</button>
              <button onClick={() => { setError(''); setStep(3); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">Next: Admin Account</button>
            </div>
          </div>
        )}

        {/* Step 3: Admin Account */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5" /> Administrator Account</h2>
              <p className="text-sm text-gray-500 mt-1">Create the initial administrator. No default password - you choose your own.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 8 characters)</label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" value={adminPasswordConfirm} onChange={e => setAdminPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition">Back</button>
              <button onClick={() => { setError(''); setStep(4); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">Next: Review</button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Complete */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><Settings className="w-5 h-5" /> Review & Complete</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Organization:</span><span className="font-medium">{orgName}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Host Port:</span><span className="font-medium">{hostPort}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Timezone:</span><span className="font-medium">{timezone}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email Mode:</span><span className="font-medium">{emailMode}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Admin Email:</span><span className="font-medium">{adminEmail}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Theme:</span>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }} />
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: secondaryColor }} />
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <strong>Note:</strong> After setup, access the app at <code className="bg-blue-100 px-1 rounded">http://localhost:{hostPort}</code>. For internet access, configure a reverse proxy with HTTPS. See the README for details.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition">Back</button>
              <button onClick={handleComplete} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition">Complete Setup</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
