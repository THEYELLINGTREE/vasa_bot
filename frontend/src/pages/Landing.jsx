import React, { useEffect, useState } from 'react';
import { Rocket, Shield, Users, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Landing() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check URL parameters for auth status
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const errorStatus = urlParams.get('error');

    if (authStatus === 'success') {
      setSuccess('Authentication successful! Welcome to Mission Control.');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorStatus) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (errorStatus) {
        case 'not_in_server':
          errorMessage = 'Access Denied: You must be a member of the required server to access Mission Control.';
          break;
        case 'insufficient_permissions':
          errorMessage = 'Access Denied: You do not have the required clearance level to access this system.';
          break;
        case 'no_code':
          errorMessage = 'Authentication Error: No authorization code received.';
          break;
        case 'auth_failed':
          errorMessage = 'Authentication Error: Failed to verify your credentials with Discord.';
          break;
      }
      
      setError(errorMessage);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            {/* Logo and Title */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Rocket 
                  size={80} 
                  className="text-blue-600 drop-shadow-lg transform rotate-45"
                />
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 scale-150"></div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              VASA
            </h1>
            <h2 className="text-2xl md:text-4xl font-semibold text-slate-600 mb-6">
              Mission Control System
            </h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Advanced space operations management platform. Authorized personnel only.
              Secure Discord authentication required for mission access.
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-3">
                <AlertCircle className="text-red-500 mt-0.5" size={24} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Access Denied</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start space-x-3">
                <Shield className="text-green-500 mt-0.5" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Authentication Successful</h3>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Button */}
          <div className="text-center mb-12">
            <button
              onClick={login}
              className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                <Shield size={24} />
                <span className="text-lg">Access Mission Control</span>
                <div className="text-sm opacity-80">via Discord</div>
              </div>
            </button>
            <p className="text-sm text-slate-500 mt-4">
              Secure authentication powered by Discord OAuth 2.0
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Mission Planning</h3>
              <p className="text-slate-500">
                Advanced event coordination and scheduling for space operations
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Crew Management</h3>
              <p className="text-slate-500">
                Real-time crew assignments and mission participation tracking
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Real-time Control</h3>
              <p className="text-slate-500">
                Instant mission updates and operational telemetry monitoring
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <Shield className="mx-auto text-slate-400 mb-3" size={32} />
              <h3 className="font-semibold text-slate-700 mb-2">Security Clearance Required</h3>
              <p className="text-slate-500 text-sm">
                Access is restricted to authorized personnel with appropriate Discord server membership 
                and security clearance levels. All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: 
            radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.1) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(59, 130, 246, 0.1) 2px, transparent 0);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}

export default Landing;