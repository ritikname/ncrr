
import React, { useState } from 'react';

interface UserOnboardingModalProps {
  isOpen: boolean;
  onComplete: (name: string, phone: string) => void;
}

const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    onComplete(name, phone);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic">Welcome to <span className="text-red-600">NCR DRIVE</span></h2>
          <p className="text-gray-500 mt-2 text-sm">Please provide your details to continue.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none bg-gray-50"
              placeholder="e.g. Rahul Sharma"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Phone Number <span className="font-extrabold text-black">(Please add WhatsApp Number)</span>
            </label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none bg-gray-50"
              placeholder="e.g. 9876543210"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all mt-2 uppercase tracking-wide"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserOnboardingModal;
