import { useBatches } from '../hooks/useData';
import { motion } from 'motion/react';
import { FileBox, Download, TrendingUp, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { cn, formatPercent } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function Reports() {
  const { batches, loading } = useBatches();
  const lowAttendanceBatches = batches.filter(b => (b.averageAttendance || 0) < 75);

  const handleGeneratePDF = () => {
    if (batches.length === 0) return toast.error('No data to export');
    const doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('Cohort - Global Attendance Report', 14, 20);
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = batches.map(b => [
      b.name,
      b.studentCount || 0,
      new Date(b.startDate).toLocaleDateString(),
      `${(b.averageAttendance || 0).toFixed(1)}%`,
      b.archived ? 'Archived' : 'Active'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Batch Name', 'Students', 'Start Date', 'Avg Attendance', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [90, 90, 64] }, // #5A5A40
    });

    doc.save(`Cohort_Report_${new Date().getTime()}.pdf`);
    toast.success('Global PDF downloaded successfully!');
  };

  const handleDownloadCSV = () => {
    if (batches.length === 0) return toast.error('No data to export');
    
    const worksheetData = batches.map(b => ({
      'Batch Name': b.name,
      'Description': b.description,
      'Students': b.studentCount || 0,
      'Start Date': new Date(b.startDate).toLocaleDateString(),
      'Average Attendance (%)': (b.averageAttendance || 0).toFixed(1),
      'Status': b.archived ? 'Archived' : 'Active',
      'Created At': new Date(b.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batches");
    
    XLSX.writeFile(workbook, `Cohort_Export_${new Date().getTime()}.xlsx`);
    toast.success('Spreadsheet downloaded successfully!');
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-[#1a1a1a] mb-2 tracking-tight">Institutional Reports</h1>
          <p className="text-gray-500 font-sans tracking-wide uppercase text-xs font-bold">Deep analytics & compliance tracking</p>
        </div>
        <button 
          onClick={handleGeneratePDF}
          className="px-6 py-3 bg-[#5A5A40] text-white rounded-2xl flex items-center gap-2 hover:bg-[#4a4a35] transition-all font-bold shadow-lg shadow-[#5A5A4020]"
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
                  <p className={cn("font-serif text-2xl", (batch.averageAttendance || 0) < 75 ? "text-red-500" : "text-emerald-600")}>
                    {formatPercent(batch.averageAttendance)}
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${batch.averageAttendance || 0}%` }}
                    className={cn("h-full transition-all duration-1000", (batch.averageAttendance || 0) < 75 ? "bg-red-500" : "bg-[#5A5A40]")} />
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
              Download the current attendance summaries, session logs, and student performance metrics in a standard Excel spreadsheet format.
            </p>
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-emerald-900 hover:gap-3 transition-all">
              <FileSpreadsheet size={16} /> Download Excel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
