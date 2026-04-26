import { cn } from '../lib/utils';
import { useBatches } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Plus, 
  ArrowUpRight,
  MoreVertical,
  Trash2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export function Batches() {
  const { batches, loading } = useBatches();
  const { profile } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd') });

  const handleAddBatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBatch.name) return;

    try {
      const batchRef = await addDoc(collection(db, 'batches'), {
        ...newBatch,
        studentCount: 0,
        averageAttendance: 0,
        createdAt: new Date().toISOString(),
      });

      // Automatically create 12 sessions for this batch
      const sessionPromises = Array.from({ length: 12 }, (_, i) => {
        const sessionDate = new Date(newBatch.startDate);
        sessionDate.setDate(sessionDate.getDate() + (i * 7)); // Weekly sessions
        return addDoc(collection(db, 'sessions'), {
          batchId: batchRef.id,
          sessionNumber: i + 1,
          date: sessionDate.toISOString(),
          title: `Session ${i + 1}`,
          attendanceCount: 0
        });
      });

      await Promise.all(sessionPromises);
      toast.success('Batch created with 12 sessions!');
      setShowAddModal(false);
      setNewBatch({ name: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      toast.error('Failed to create batch');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm('Delete this batch? This will remove all students and sessions.')) return;
    try {
      await deleteDoc(doc(db, 'batches', id));
      toast.success('Batch deleted');
    } catch (err) {
      toast.error('Failed to delete batch');
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-5xl text-[#1a1a1a] mb-2 tracking-tight">Batches</h1>
          <p className="text-gray-500 font-sans tracking-wide uppercase text-xs font-bold font-sans">Institutional grouping & scheduling</p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#5A5A40] text-white rounded-2xl flex items-center gap-2 hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A4020] font-bold"
          >
            <Plus size={20} /> New Batch
          </button>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-[#e5e5e0]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[32px] border border-[#e5e5e0] overflow-hidden group hover:border-[#5A5A40] transition-colors flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-[#5A5A40] transition-colors">
                    <Users size={24} />
                  </div>
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <h3 className="font-serif text-2xl text-[#1a1a1a] mb-2 group-hover:text-[#5A5A40] transition-colors">{batch.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">{batch.description || 'No description provided.'}</p>
                
                <div className="flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest fill-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {format(new Date(batch.startDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    {batch.studentCount || 0} Students
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50 border-t border-[#e5e5e0] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Attendance</p>
                  <p className={cn(
                    "text-lg font-serif",
                    (batch.averageAttendance || 0) < 75 ? "text-red-500" : "text-[#1a1a1a]"
                  )}>
                    {(batch.averageAttendance || 0).toFixed(1)}%
                  </p>
                </div>
                <Link 
                  to={`/batches/${batch.id}`}
                  className="w-10 h-10 rounded-full bg-white border border-[#e5e5e0] flex items-center justify-center text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl"
          >
            <h2 className="font-serif text-3xl mb-6">Create New Batch</h2>
            <form onSubmit={handleAddBatch} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Batch Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                  placeholder="e.g. Fullstack Dev - Spring 2026"
                  value={newBatch.name}
                  onChange={e => setNewBatch({...newBatch, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Description</label>
                <textarea 
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all h-24"
                  placeholder="Batch details..."
                  value={newBatch.description}
                  onChange={e => setNewBatch({...newBatch, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Start Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                  value={newBatch.startDate}
                  onChange={e => setNewBatch({...newBatch, startDate: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 text-gray-500 font-bold uppercase text-[10px] border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#1a1a1a] text-white rounded-xl font-bold uppercase text-[10px] hover:bg-black transition-colors"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
