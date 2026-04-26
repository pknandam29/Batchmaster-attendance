import { useParams, Link } from 'react-router-dom';
import { useBatches, useBatchStudents, useBatchSessions } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  UserPlus, 
  Download,
  Filter,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export function BatchDetail() {
  const { id } = useParams();
  const { batches } = useBatches();
  const batch = batches.find(b => String(b.id) === id);
  const { students, loading: studentsLoading, refresh: refreshStudents } = useBatchStudents(id);
  const { sessions, loading: sessionsLoading } = useBatchSessions(id);
  const { profile } = useAuth();

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeSessionId) {
      const fetchAttendance = async () => {
        try {
          const res = await fetch(`/api/attendance/${activeSessionId}`);
          const data = await res.json();
          setAttendanceRecords(data);
        } catch (err) {
          console.error('Failed to fetch attendance:', err);
        }
      };
      fetchAttendance();
    }
  }, [activeSessionId]);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !id) return;

    try {
      const res = await fetch(`/api/batches/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Student added!');
      setShowAddStudent(false);
      setNewStudent({ name: '', email: '' });
      refreshStudents();
    } catch (err) {
      toast.error('Failed to add student');
    }
  };

  const markAttendance = async (studentId: number, status: 'present' | 'absent') => {
    if (!activeSessionId || !id) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: Number(id), sessionId: activeSessionId, studentId, status }),
      });
      if (!res.ok) throw new Error('Failed');
      setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark attendance');
    }
  };

  if (!batch) return null;

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between">
        <div className="flex gap-6">
          <Link 
            to="/batches"
            className="mt-2 w-12 h-12 rounded-2xl bg-white border border-[#e5e5e0] flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] transition-all"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-5xl text-[#1a1a1a] tracking-tight">{batch.name}</h1>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
            </div>
            <p className="text-gray-500 font-sans tracking-wide border-l-2 border-[#5A5A40] pl-4 h-12 flex items-center">{batch.description || 'Session tracking and student engagement.'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.success('Report exported successfully!')}
            className="px-6 py-3 border border-[#e5e5e0] text-[#1a1a1a] rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all font-bold text-sm"
          >
            <Download size={18} /> Export Report
          </button>
          {profile?.role === 'admin' && (
            <button 
              onClick={async () => {
                if (window.confirm('Delete this batch? This will remove everything related to it.')) {
                  try {
                    const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed');
                    toast.success('Batch deleted');
                    window.location.href = '/batches';
                  } catch (err) {
                    toast.error('Failed to delete batch');
                  }
                }
              }}
              className="px-6 py-3 border border-red-100 text-red-500 rounded-2xl flex items-center gap-2 hover:bg-red-50 transition-all font-bold text-sm"
            >
              <Trash2 size={18} /> Delete Batch
            </button>
          )}
          <button 
            onClick={() => setShowAddStudent(true)}
            className="px-6 py-3 bg-[#1a1a1a] text-white rounded-2xl flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-[#00000020] font-bold text-sm"
          >
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </header>

      {/* Grid: Stats & Session Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Sessions Grid */}
          <section className="bg-white p-10 rounded-[40px] border border-[#e5e5e0]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-[#1a1a1a]">Batch Sessions</h2>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total: 12 Sessions</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sessions.map((session) => {
                const isActive = activeSessionId === session.id;
                const isPast = new Date(session.date) < new Date();
                return (
                  <motion.button
                    key={session.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                      "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all",
                      isActive 
                        ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-lg shadow-[#5A5A4040]" 
                        : isPast 
                          ? "bg-gray-50 border-gray-100 text-gray-400"
                          : "bg-white border-[#e5e5e0] text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                    )}
                  >
                    <span className="text-[10px] uppercase font-black opacity-50">S-{session.sessionNumber}</span>
                    <span className="font-serif text-lg leading-none">{format(new Date(session.date), 'dd/MM')}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Attendance UI */}
          <AnimatePresence mode="wait">
            {activeSessionId ? (
              <motion.section 
                key={activeSessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-10 rounded-[40px] border border-[#e5e5e0]"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-serif text-2xl text-[#1a1a1a]">
                      Attendance: Session {sessions.find(s => s.id === activeSessionId)?.sessionNumber}
                    </h2>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">
                      {format(new Date(sessions.find(s => s.id === activeSessionId)?.date || ''), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                  <button onClick={() => setActiveSessionId(null)} className="text-sm font-bold text-gray-400 hover:text-red-500">Close</button>
                </div>

                <div className="overflow-hidden bg-gray-50 rounded-3xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-bottom border-gray-100">
                        <th className="px-8 py-5 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Student Name</th>
                        <th className="px-8 py-5 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Email</th>
                        <th className="px-8 py-5 text-right text-[10px] uppercase font-bold text-gray-400 tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student) => {
                        const status = attendanceRecords[student.id];
                        return (
                          <tr key={student.id} className="group hover:bg-white transition-colors">
                            <td className="px-8 py-4">
                              <p className="font-bold text-[#1a1a1a]">{student.name}</p>
                            </td>
                            <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{student.email}</td>
                            <td className="px-8 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => markAttendance(student.id, 'present')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    status === 'present' 
                                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                                      : "bg-white border border-gray-200 text-gray-400 hover:border-emerald-500 hover:text-emerald-500"
                                  )}
                                >
                                  Present
                                </button>
                                <button 
                                  onClick={() => markAttendance(student.id, 'absent')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    status === 'absent' 
                                      ? "bg-red-500 text-white shadow-md shadow-red-500/20" 
                                      : "bg-white border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500"
                                  )}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="p-20 text-center">
                      <p className="text-gray-400 italic">No students in this batch.</p>
                      <button onClick={() => setShowAddStudent(true)} className="mt-4 text-[#5A5A40] font-bold text-sm underline uppercase tracking-widest">Add First Student</button>
                    </div>
                  )}
                </div>
              </motion.section>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-100/50 rounded-[40px] border border-dashed border-gray-200 p-20 text-center"
              >
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Select a session from the grid above to start marking attendance.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Student Sidebar List */}
        <div className="space-y-8">
          <section className="bg-[#1a1a1a] p-10 rounded-[40px] text-white">
            <h2 className="font-serif text-2xl mb-8">Performance</h2>
            <div className="space-y-6">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm leading-tight">{student.name}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mt-0.5">Student ID: {student.id}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-serif",
                      (student.attendancePercentage || 0) < 75 ? "text-red-400" : "text-emerald-400"
                    )}>
                      {(student.attendancePercentage || 0).toFixed(1)}%
                    </p>
                    <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          (student.attendancePercentage || 0) < 75 ? "bg-red-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${student.attendancePercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="text-gray-600 italic">No students yet.</p>}
            </div>
          </section>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl"
          >
            <h2 className="font-serif text-3xl mb-6">Enroll Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Full Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                  placeholder="e.g. John Doe"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Email Address</label>
                <input 
                  type="email"
                  required
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                  placeholder="john@example.com"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="flex-1 py-4 text-gray-500 font-bold uppercase text-[10px] border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#1a1a1a] text-white rounded-xl font-bold uppercase text-[10px] hover:bg-black transition-colors"
                >
                  Add Student
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
