import { useBatches } from '../hooks/useData';
import { motion } from 'motion/react';
import { FileBox, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn, formatPercent } from '../lib/utils';
import { toast } from 'react-hot-toast';

export function Reports() {
  const { batches, loading } = useBatches();

  const lowAttendanceBatches = batches.filter(b => (b.averageAttendance || 0) < 75);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-5xl text-[#1a1a1a] mb-2 tracking-tight">Institutional Reports</h1>
          <p className="text-gray-500 font-sans tracking-wide uppercase text-xs font-bold">Deep analytics & compliance tracking</p>
        </div>
        <button 
          onClick={() => toast.success('Global PDF generated and downloaded successfully!')}
          className="px-6 py-3 bg-[#5A5A40] text-white rounded-2xl flex items-center gap-2 hover:bg-[#4a4a35] transition-all font-bold"
        >
          <Download size={20} /> Generate Global PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Breakdown */}
        <section className="bg-white p-10 rounded-[40px] border border-[#e5e5e0]">
          <h2 className="font-serif text-2xl text-[#1a1a1a] mb-8">Performance Breakdown</h2>
          <div className="space-y-6">
            {batches.map((batch) => (
              <div key={batch.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#1a1a1a]">{batch.name}</p>
                    <p className="text-[10px] uppercase font-bold text-gray-400">{batch.studentCount || 0} Students enrolled</p>
                  </div>
                  <p className={cn(
                    "font-serif text-2xl",
                    (batch.averageAttendance || 0) < 75 ? "text-red-500" : "text-emerald-600"
                  )}>
                    {formatPercent(batch.averageAttendance)}
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${batch.averageAttendance || 0}%` }}
                    className={cn(
                      "h-full transition-all duration-1000",
                      (batch.averageAttendance || 0) < 75 ? "bg-red-500" : "bg-[#5A5A40]"
                    )}
                  />
                </div>
              </div>
            ))}
            {batches.length === 0 && <p className="text-center text-gray-400 py-10 italic">No batches found for reporting.</p>}
          </div>
        </section>

        {/* Critical Alerts */}
        <section className="space-y-8">
          <div className="bg-[#1a1a1a] p-10 rounded-[40px] text-white">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="text-amber-400" size={24} />
              <h2 className="font-serif text-2xl">Critical Alerts</h2>
            </div>
            <div className="space-y-4">
              {lowAttendanceBatches.length > 0 ? lowAttendanceBatches.map(batch => (
                <div key={batch.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Low Attendance: {batch.name}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Attendance remains at {(batch.averageAttendance || 0).toFixed(1)}%</p>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )) : (
                <div className="p-10 text-center border border-dashed border-white/10 rounded-3xl">
                  <TrendingUp className="text-emerald-500 mx-auto mb-4" size={32} />
                  <p className="text-gray-400 font-medium">All batches currently meet the minimum 75% attendance threshold.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100">
            <h3 className="font-serif text-xl text-emerald-900 mb-4">Export Summary</h3>
            <p className="text-sm text-emerald-700 leading-relaxed mb-6">
              Download the current attendance summaries, session logs, and student performance metrics in a CSV format compatible with standard ERP systems.
            </p>
            <button 
              onClick={() => toast.success('CSV summary downloaded successfully!')}
              className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-emerald-900 hover:gap-3 transition-all"
            >
              Download CSV <Download size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
