import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

export function Login() {
  const { login } = useAuth();

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
        <h1 className="font-serif text-4xl text-[#1a1a1a] mb-2">BatchMaster</h1>
        <p className="text-gray-500 mb-8 font-sans">Attendance & Session Tracking</p>
        
        <button 
          onClick={login}
          className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-black transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
