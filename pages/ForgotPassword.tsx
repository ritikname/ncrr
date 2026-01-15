
import React, { useState } from 'react';
import { api } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.auth.forgotPassword(email);
    setSent(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-black text-gray-900 mb-4 text-center">Reset Password</h2>
        {sent ? (
          <div className="text-center text-green-600 font-medium">
            If an account exists with that email, we have sent a reset link. Check your inbox (and spam).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Enter your registered email address.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="name@example.com" required />
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold">Send Reset Link</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
