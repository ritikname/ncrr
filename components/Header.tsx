
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
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/')}>
            <div className="flex flex-col leading-none select-none">
                <span className="text-2xl font-black text-red-600 tracking-tighter transform -skew-x-6">NCR</span>
                <span className="text-2xl font-black text-black tracking-tighter transform -skew-x-6 -mt-2">DRIVE</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>
            <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Official Portal
            </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <span className="text-sm font-bold text-gray-700">Hello, {user.name || 'User'}</span>
              {isOwner && (
                <button 
                    onClick={() => onToggleView(viewMode === 'owner' ? 'customer' : 'owner')} 
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors border ${viewMode === 'owner' ? 'bg-red-600 text-white border-red-600' : 'text-red-600 border-red-600 hover:bg-red-50'}`}
                >
                   {viewMode === 'owner' ? 'View as Customer' : 'Manage Fleet'}
                </button>
              )}
              <button onClick={logout} className="text-sm font-bold text-gray-500 hover:text-black">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-900 hover:text-red-600">Log In</button>
              <button onClick={() => navigate('/signup')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-500/30 transition-all">Sign Up</button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl animate-fade-in z-40">
           <div className="p-4 space-y-4 flex flex-col">
              {user ? (
                <>
                   <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                       <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-bold">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                       </div>
                   </div>
                   
                   {isOwner && (
                     <button 
                        onClick={() => { onToggleView(viewMode === 'owner' ? 'customer' : 'owner'); setIsMenuOpen(false); }}
                        className="w-full text-left py-3 px-2 rounded-lg text-sm font-bold text-red-600 uppercase tracking-wide hover:bg-red-50 transition-colors"
                     >
                        {viewMode === 'owner' ? '👥 Switch to Customer View' : '🔧 Manage Fleet'}
                     </button>
                   )}

                   <button onClick={handleLogout} className="w-full text-left py-3 px-2 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg">
                      Logout
                   </button>
                </>
              ) : (
                <>
                   <button onClick={() => handleNavigation('/login')} className="w-full py-3 text-center font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">Log In</button>
                   <button onClick={() => handleNavigation('/signup')} className="w-full py-3 text-center font-bold text-white bg-red-600 rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700">Sign Up</button>
                </>
              )}
           </div>
        </div>
      )}
      
      {isOwner && viewMode === 'owner' && (
        <div className="w-full text-center text-[10px] uppercase font-bold tracking-widest py-1 text-white bg-black">
          🔧 Owner Console Active
        </div>
      )}
    </header>
  );
};

export default Header;
