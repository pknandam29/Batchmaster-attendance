import { useAuditLog } from '../hooks/useData';
import { motion } from 'motion/react';
import { ScrollText, User, LogIn, Trash2, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';

const actionIcons: Record<string, any> = {
  LOGIN: LogIn,
  CREATE: Plus,
  DELETE: Trash2,
  UPDATE: Edit,
};

export function AuditLog() {
  const { logs, loading } = useAuditLog();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl lg:text-5xl text-[#1a1a1a] mb-2 tracking-tight">Audit Log</h1>
        <p className="text-gray-500 font-sans tracking-wide uppercase text-xs font-bold">System activity & change tracking</p>
      </header>

      <div className="bg-white rounded-[40px] border border-[#e5e5e0] overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-gray-400">Loading audit log...</div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center text-gray-400 italic">No activity recorded yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, i) => {
              const Icon = actionIcons[log.action] || ScrollText;
              return (
                <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="px-8 py-5 flex items-center gap-6 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1a1a1a]">
                      <span className="font-bold">{log.userName || 'System'}</span>
                      <span className="text-gray-400"> — </span>
                      {log.details || `${log.action} ${log.entity}`}
                    </p>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mt-1">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')} • {log.entity}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest hidden md:block">
                    {log.action}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
