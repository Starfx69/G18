
import React, { useMemo } from 'react';
import type { AttendanceRecord } from '../types.ts';
import { BackArrowIcon, CheckCircleIcon, XCircleIcon, LayoutDashboardIcon } from './Icons.tsx';

interface DashboardProps {
  records: AttendanceRecord[];
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, onBack }) => {

  const analytics = useMemo(() => {
    const success = records.filter(r => r.status === 'SUCCESS').length;
    const failure = records.filter(r => r.status === 'FAILURE').length;
    const total = records.length;

    const anomalies = new Map<string, number>();
    let consecutiveFailures = 0;
    let lastStudentId = '';
    
    for (let i = records.length - 1; i >= 0; i--) {
        const record = records[i];
        if (record.studentId === 'UNKNOWN') continue;
        
        if (record.status === 'FAILURE') {
            if (record.studentId === lastStudentId) {
                consecutiveFailures++;
            } else {
                lastStudentId = record.studentId;
                consecutiveFailures = 1;
            }
        } else {
            lastStudentId = record.studentId;
            consecutiveFailures = 0;
        }

        if (consecutiveFailures >= 2) {
            if (!anomalies.has(record.studentName)) {
                 anomalies.set(record.studentName, consecutiveFailures);
            }
        }
    }


    return { success, failure, total, anomalies: Array.from(anomalies.keys()) };
  }, [records]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 w-full max-w-6xl">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4">
          <BackArrowIcon />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">System Dashboard</h2>
          <p className="text-slate-400">Overall attendance records and system analytics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-full"><LayoutDashboardIcon className="w-8 h-8 text-blue-400" /></div>
            <div>
                <p className="text-3xl font-bold text-slate-100">{analytics.total}</p>
                <p className="text-slate-400">Total Records</p>
            </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-full"><CheckCircleIcon className="w-8 h-8 text-green-400" /></div>
            <div>
                <p className="text-3xl font-bold text-slate-100">{analytics.success}</p>
                <p className="text-slate-400">Successful authentications</p>
            </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-red-500/10 p-3 rounded-full"><XCircleIcon className="w-8 h-8 text-red-400" /></div>
            <div>
                <p className="text-3xl font-bold text-slate-100">{analytics.failure}</p>
                <p className="text-slate-400">Failed authentications</p>
            </div>
        </div>
      </div>
      
      {analytics.anomalies.length > 0 && (
        <div className="bg-amber-900/50 border border-amber-500/50 text-amber-300 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-lg">Anomaly Detected</h3>
          <p className="text-amber-400">Multiple consecutive failed attempts for: <span className="font-semibold">{analytics.anomalies.join(', ')}</span>. Manual verification is advised.</p>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4">Recent Activity Log</h3>
      <div className="overflow-x-auto">
        <div className="min-w-full bg-slate-800 border border-slate-700 rounded-lg table-striped">
          <div className="grid grid-cols-5 font-semibold text-slate-400 p-3 border-b border-slate-700">
            <div>Student Name</div>
            <div>Lecture</div>
            <div>Timestamp</div>
            <div className="text-center">Status</div>
            <div>Details</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {records.length === 0 ? (
                <p className="text-center text-slate-500 p-8">No attendance records yet.</p>
            ) : (
                [...records].reverse().map(record => (
                  <div key={record.id} className="grid grid-cols-5 p-3 border-b border-slate-800 items-center text-slate-400">
                    <div className="font-medium text-slate-200">{record.studentName}</div>
                    <div>{record.lectureTitle}</div>
                    <div>{new Date(record.timestamp).toLocaleString()}</div>
                    <div className="flex justify-center">
                      {record.status === 'SUCCESS' ? 
                        <span className="text-xs font-semibold bg-green-500/10 text-green-300 px-2.5 py-1 rounded-full">Success</span> : 
                        <span className="text-xs font-semibold bg-red-500/10 text-red-300 px-2.5 py-1 rounded-full">Failure</span>
                      }
                    </div>
                    <div className="text-sm">{record.failureReason || 'N/A'}</div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
