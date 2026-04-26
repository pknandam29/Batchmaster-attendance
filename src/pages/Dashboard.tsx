import { useBatches, useUpcomingSessions, useDashboardAlerts, useDashboardTrends } from '../hooks/useData';
import { motion } from 'motion/react';
import { Users, Calendar, ArrowRight, TrendingUp, FileBox, AlertTriangle, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

export function Dashboard() {
  const { batches } = useBatches();
  const { sessions: upcoming } = useUpcomingSessions();
  const { alerts } = useDashboardAlerts();
  const { trends } = useDashboardTrends();

  const stats = [
    { label: 'Total Batches', value: batches.length, icon: FileBox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Students', value: batches.reduce((acc, b) => acc + (b.studentCount || 0), 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Attendance', value: `${(batches.reduce((acc, b) => acc + (b.averageAttendance || 0), 0) / (batches.length || 1)).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const chartData = batches.map(b => ({ name: b.name, attendance: b.averageAttendance || 0 }));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl lg:text-5xl text-[#1a1a1a] mb-2 tracking-tight">Intelligence Dashboard</h1>
        <p className="text-gray-500 font-sans tracking-wide uppercase text-xs font-bold">Real-time attendance & operational performance</p>
      </header>

      {/* Notifications Banner */}
      {(alerts.lowAttendanceStudents?.length > 0 || alerts.todaySessions?.length > 0) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <Bell className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="space-y-1 text-sm">
            {alerts.lowAttendanceStudents?.length > 0 && (
              <p className="text-amber-800"><span className="font-bold">{alerts.lowAttendanceStudents.length} students</span> below 75% attendance threshold</p>
            )}
            {alerts.todaySessions?.length > 0 && (
              <p className="text-amber-800"><span className="font-bold">{alerts.todaySessions.length} sessions</span> scheduled for today</p>
            )}
            {alerts.nearingCompletion?.length > 0 && (
              <p className="text-amber-800"><span className="font-bold">{alerts.nearingCompletion.length} batches</span> nearing completion (10+ sessions done)</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-[#e5e5e0] group hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
            <h3 className="text-4xl font-serif text-[#1a1a1a]">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Batch Attendance Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-[#e5e5e0]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-2xl text-[#1a1a1a]">Batch Performance</h2>
              <p className="text-sm text-gray-400 font-medium">Avg attendance across active batches</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f9fafb' }} content={({ active, payload }) => {
                  if (active && payload?.length) return <div className="bg-black text-white p-3 rounded-xl shadow-xl text-xs font-bold uppercase tracking-wider">{payload[0].value}% Attendance</div>;
                  return null;
                }} />
                <Bar dataKey="attendance" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.attendance < 75 ? '#f87171' : '#5A5A40'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-[#1a1a1a] p-10 rounded-[32px] text-white">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-2xl">Upcoming</h2>
            <Calendar size={20} className="text-[#5A5A40]" />
          </div>
          <div className="space-y-6">
            {upcoming.length === 0 ? (
              <p className="text-gray-500 font-medium italic">No sessions scheduled.</p>
            ) : upcoming.map((session, i) => (
              <motion.div key={session.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="group cursor-pointer">
                <div className="flex items-start gap-4 mb-2">
                  <div className="bg-[#5A5A40] p-3 rounded-xl text-center min-w-[50px]">
                    <span className="block text-xs font-bold uppercase">{format(new Date(session.date), 'MMM')}</span>
                    <span className="block text-lg font-serif">{format(new Date(session.date), 'dd')}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm group-hover:text-[#5A5A40] transition-colors">{session.title}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{session.batchName || 'Batch'}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Session {session.sessionNumber} of 12</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      {trends.length > 0 && (
        <div className="bg-white p-10 rounded-[32px] border border-[#e5e5e0]">
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-[#1a1a1a]">Weekly Attendance Trends</h2>
            <p className="text-sm text-gray-400 font-medium">Avg attendance percentage over recent weeks</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) return <div className="bg-black text-white p-3 rounded-xl shadow-xl text-xs font-bold">{payload[0].value}% avg</div>;
                  return null;
                }} />
                <Line type="monotone" dataKey="avgAttendance" stroke="#5A5A40" strokeWidth={3} dot={{ r: 4, fill: '#5A5A40' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Low Attendance Alerts */}
      {alerts.lowAttendanceStudents?.length > 0 && (
        <div className="bg-red-50 p-10 rounded-[32px] border border-red-100">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="font-serif text-2xl text-red-900">Low Attendance Alerts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.lowAttendanceStudents.map((s: any) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[#1a1a1a]">{s.name}</p>
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">{s.batchName}</p>
                </div>
                <p className="text-red-500 font-serif text-xl">{s.attendancePercentage?.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
