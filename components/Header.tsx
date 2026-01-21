
import React, { useState } from 'react';
import { ViewMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, onToggleView }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    // Changed: bg-gray-900 -> bg-gray-900/80 backdrop-blur-md border-white/10
    <header className="fixed top-0 left-0 w-full z-50 bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-white/10 group transition-all duration-300">
      {/* Background Wrapper with Overflow Hidden to contain Road/Car animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <style>{`
            @keyframes roadMove {
              0% { background-position: 0px 0; }
              100% { background-position: -60px 0; }
            }
            @keyframes carVibrate {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-0.5px) rotate(-0.5deg); }
              50% { transform: translateY(0) rotate(0deg); }
              75% { transform: translateY(-0.5px) rotate(0.5deg); }
            }
            @keyframes streetLightMove {
              0% { transform: translateX(110vw); }
              100% { transform: translateX(-100px); }
            }
            .animate-road {
              animation: roadMove 0.4s linear infinite;
            }
            .animate-car {
              animation: carVibrate 0.15s ease-in-out infinite;
            }
            .animate-street-light {
              animation: streetLightMove 2s linear infinite;
            }
          `}</style>
          
          {/* --- BACKGROUND ROAD ANIMATION --- */}
          <div className="absolute inset-0 z-0">
              {/* Asphalt Texture overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')]"></div>
              
              {/* Street Lights Animation (Passing in background) */}
              <div className="absolute inset-0 w-full h-full">
                 {[0, 1, 2].map((i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 h-full w-4 animate-street-light will-change-transform"
                      style={{ animationDelay: `${i * 0.7}s` }}
                    >
                        {/* Pole */}
                        <div className="w-1 h-full bg-gray-700 mx-auto"></div>
                        {/* Light Fixture */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-800 rounded-full"></div>
                        {/* Light Bulb & Glow */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-100 rounded-full blur-[1px]"></div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl pointer-events-none"></div>
                    </div>
                 ))}
              </div>

              {/* Dashed Center Line */}
              <div 
                className="absolute top-1/2 left-0 w-full h-[4px] -mt-[2px] animate-road opacity-30"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.8) 50%, transparent 50%)',
                    backgroundSize: '60px 100%'
                }}
              ></div>

              {/* Top/Bottom Road Borders (Subtle) */}
              <div className="absolute top-0 w-full h-[1px] bg-gray-800"></div>
              <div className="absolute bottom-0 w-full h-[1px] bg-gray-800"></div>
          </div>

          {/* --- THE CAR (Centered) --- */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
             <div className="animate-car filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                <svg width="60" height="30" viewBox="0 0 36 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10L5 6H14L16 10H2Z" fill="#DC2626"/>
                    <path d="M1 10H33C34.1 10 35 10.9 35 12V14H1V10Z" fill="#B91C1C"/>
                    <path d="M6 7L13 7L15 9.5H3L6 7Z" fill="#1F2937"/>
                    <circle cx="7" cy="14" r="3" fill="#111827"/>
                    <circle cx="7" cy="14" r="1.5" fill="#4B5563"/>
                    <circle cx="29" cy="14" r="3" fill="#111827"/>
                    <circle cx="29" cy="14" r="1.5" fill="#4B5563"/>
                    <path d="M35 11 L60 8 L60 15 L35 13 Z" fill="url(#headlight_grad)" className="opacity-40" />
                    <rect x="33" y="11" width="1" height="2" fill="#FCD34D" />
                    <defs>
                       <linearGradient id="headlight_grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0"/>
                       </linearGradient>
                    </defs>
                </svg>
             </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => handleNavigation('/')}>
            <div className="flex flex-col leading-none select-none">
                <span className="text-2xl font-black text-red-500 tracking-tighter transform -skew-x-6 drop-shadow-md">NCR</span>
                <span className="text-2xl font-black text-white tracking-tighter transform -skew-x-6 -mt-2 drop-shadow-md">DRIVE</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-700 mx-1"></div>
            <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Official Portal
            </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6 flex-shrink-0">
          {user ? (
            <>
              <span className="text-sm font-bold text-gray-300">Hello, {user.name || 'User'}</span>
              
              {!isOwner && (
                <button 
                  onClick={() => handleNavigation('/my-bookings')} 
                  className="text-sm font-bold text-gray-300 hover:text-white transition-colors"
                >
                  My Bookings
                </button>
              )}

              {isOwner && (
                <button 
                    onClick={() => onToggleView(viewMode === 'owner' ? 'customer' : 'owner')} 
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors border ${viewMode === 'owner' ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-500 hover:bg-white/10'}`}
                >
                   {viewMode === 'owner' ? 'View as Customer' : 'Manage Fleet'}
                </button>
              )}
              <button onClick={logout} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Log In</button>
              <button onClick={() => navigate('/signup')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-500/30 transition-all">Sign Up</button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                 </svg>
             </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - Glass Effect */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-xl border-t border-white/10 absolute top-full w-full left-0 shadow-xl animate-fade-in z-40">
           <div className="p-4 space-y-4 flex flex-col">
              {user ? (
                <>
                   <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                       <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-red-500 font-bold">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                       </div>
                   </div>
                   
                   {!isOwner && (
                      <button 
                        onClick={() => handleNavigation('/my-bookings')}
                        className="w-full text-left py-3 px-2 rounded-lg text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                         📅 My Bookings
                      </button>
                   )}

                   {isOwner && (
                     <button 
                        onClick={() => { onToggleView(viewMode === 'owner' ? 'customer' : 'owner'); setIsMenuOpen(false); }}
                        className="w-full text-left py-3 px-2 rounded-lg text-sm font-bold text-red-500 uppercase tracking-wide hover:bg-white/10 transition-colors"
                     >
                        {viewMode === 'owner' ? '👥 Switch to Customer View' : '🔧 Manage Fleet'}
                     </button>
                   )}

                   <button onClick={handleLogout} className="w-full text-left py-3 px-2 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                      Logout
                   </button>
                </>
              ) : (
                <>
                   <button onClick={() => handleNavigation('/login')} className="w-full py-3 text-center font-bold text-gray-300 border border-white/20 rounded-xl hover:bg-white/10">Log In</button>
                   <button onClick={() => handleNavigation('/signup')} className="w-full py-3 text-center font-bold text-white bg-red-600 rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700">Sign Up</button>
                </>
              )}
           </div>
        </div>
      )}
      
      {isOwner && viewMode === 'owner' && (
        <div className="w-full text-center text-[10px] uppercase font-bold tracking-widest py-1 text-white bg-black/60 backdrop-blur-md border-t border-white/10 absolute bottom-0 z-20">
          🔧 Owner Console Active
        </div>
      )}
    </header>
  );
};

export default Header;
