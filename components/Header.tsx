
import React from 'react';
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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex flex-col leading-none select-none">
                <span className="text-2xl font-black text-red-600 tracking-tighter transform -skew-x-6">NCR</span>
                <span className="text-2xl font-black text-black tracking-tighter transform -skew-x-6 -mt-2">DRIVE</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>
            <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Official Portal
            </span>
        </div>

        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <span className="text-sm font-bold text-gray-700">Hello, {user.name || 'User'}</span>
              {isOwner && (
                <button onClick={() => onToggleView(viewMode === 'owner' ? 'customer' : 'owner')} className="text-xs font-bold uppercase tracking-wider text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50">
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
      </div>
      
      {isOwner && viewMode === 'owner' && (
        <div className="w-full text-center text-[10px] uppercase font-bold tracking-widest py-1 text-white bg-black transition-colors duration-300">
          🔧 Owner Administration Console
        </div>
      )}
    </header>
  );
};

export default Header;
