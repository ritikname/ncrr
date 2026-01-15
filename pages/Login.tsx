
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInitDB = async () => {
    setError('');
    setSuccessMsg('Initializing Database...');
    try {
        const res = await api.system.init();
        if (res.success) {
            setSuccessMsg('Success! Database initialized. You can now log in.');
            // Clear fields to allow normal login
            setEmail('');
            setPassword('');
        } else {
            setError('Failed: ' + JSON.stringify(res));
            setSuccessMsg('');
        }
    } catch (e: any) {
        setError('Error: ' + e.message);
        setSuccessMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Secret Backdoor to Initialize DB
    if (email === 'Initialize Database' && password === 'Initialize Database') {
        await handleInitDB();
        return;
    }

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
      setSuccessMsg('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Login to NCR DRIVE</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-bold text-center">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm font-bold text-center">{successMsg}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            {/* Type text allows entering the secret command "Initialize Database" without validation errors */}
            <input 
                type="text" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full p-3 border rounded-xl" 
                required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full p-3 border rounded-xl" 
                required 
            />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">Login</button>
        </form>
        <div className="mt-4 text-center text-sm space-y-3">
          <Link to="/forgot-password" className="block text-gray-500 hover:text-black">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
