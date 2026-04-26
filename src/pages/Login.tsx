import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Navigate } from 'react-router-dom';

export function Login() {
  const { user, loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // If already logged in, redirect to dashboard
  if (user) return <Navigate to="/" />;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await loginWithCredentials(username, password);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f0]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 bg-white rounded-[32px] shadow-xl max-w-md w-full text-center"
      >
        <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LogIn className="text-white w-8 h-8" />
        </div>
        <h1 className="font-serif text-4xl text-[#1a1a1a] mb-2">Cohort</h1>
        <p className="text-gray-500 mb-8 font-sans">Attendance & Session Tracking</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit"
            className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-3"
          >
            <LogIn size={20} />
            Sign In
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6">Test credentials: admin / admin</p>
      </motion.div>
    </div>
  );
}
