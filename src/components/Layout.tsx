import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { LayoutDashboard, Calendar, User, LogOut, Shield, QrCode, FileText, Award, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, settings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/checkin', label: 'Check In', icon: QrCode },
    { path: '/waivers', label: 'Waivers', icon: FileText },
    { path: '/medals', label: 'Medals', icon: Award },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  if (currentUser?.role === 'admin' || currentUser?.role === 'assistant') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.primaryColor }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 hidden sm:block">{settings.name}</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? { backgroundColor: settings.primaryColor } : {}}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Sign out">
                <LogOut className="w-5 h-5" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white pb-3">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                  location.pathname === item.path ? 'text-white' : 'text-gray-600'
                }`}
                style={location.pathname === item.path ? { backgroundColor: settings.primaryColor } : {}}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
