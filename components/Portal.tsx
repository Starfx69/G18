
import React, { useState, useMemo, useEffect } from 'react';
import type { AttendanceRecord, Student, User } from '../types.ts';
import { BackArrowIcon, CheckCircleIcon, XCircleIcon, UserIcon, TrashIcon } from './Icons.tsx';
import { BarChart } from './BarChart.tsx';

interface PortalProps {
  records: AttendanceRecord[];
  students: Student[];
  onBack: () => void;
  loggedInUser: User;
  onDeleteStudent: (studentId: string) => void;
}

type PortalView = 'ADMIN' | 'STUDENT';

export const Portal: React.FC<PortalProps> = ({ records, students, onBack, loggedInUser, onDeleteStudent }) => {
  const [view, setView] = useState<PortalView>(loggedInUser.role === 'ADMIN' ? 'ADMIN' : 'STUDENT');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    loggedInUser.role === 'STUDENT' 
      ? loggedInUser.student.id 
      : (students.length > 0 ? students[0].id : null)
  );
  
  // If admin logs in and no student is selected yet, but students exist, select the first one.
  useEffect(() => {
      if(loggedInUser.role === 'ADMIN' && !selectedStudentId && students.length > 0) {
          setSelectedStudentId(students[0].id);
      }
      // If the selected student was deleted, select the first available student
      if (selectedStudentId && !students.find(s => s.id === selectedStudentId)) {
          setSelectedStudentId(students.length > 0 ? students[0].id : null);
      }
  }, [students, selectedStudentId, loggedInUser]);

  const adminAnalytics = useMemo(() => {
    const totalSuccess = records.filter(r => r.status === 'SUCCESS').length;
    const attendanceRate = records.length > 0 ? (totalSuccess / records.length) * 100 : 0;
    
    const anomalies = new Map<string, {name: string, count: number}>();
    const studentRecords = new Map<string, AttendanceRecord[]>();

    students.forEach(s => studentRecords.set(s.id, []));
    records.forEach(r => {
        if (studentRecords.has(r.studentId)) {
            studentRecords.get(r.studentId)!.push(r);
        }
    });

    studentRecords.forEach((studentRecs, studentId) => {
        let consecutiveFailures = 0;
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        for(const record of [...studentRecs].reverse()) {
            if (record.status === 'FAILURE') {
                consecutiveFailures++;
            } else {
                break; 
            }
        }
        if (consecutiveFailures >= 2) {
            anomalies.set(studentId, { name: student.name, count: consecutiveFailures });
        }
    });

    return { 
        totalStudents: students.length, 
        attendanceRate: attendanceRate.toFixed(1),
        anomalies: Array.from(anomalies.values())
    };
  }, [records, students]);

  const studentData = useMemo(() => {
    if (!selectedStudentId) return null;
    const studentRecords = records.filter(r => r.studentId === selectedStudentId);
    const success = studentRecords.filter(r => r.status === 'SUCCESS').length;
    const failure = studentRecords.length - success;
    const successRate = studentRecords.length > 0 ? (success / studentRecords.length) * 100 : 0;
    return {
        records: studentRecords,
        success,
        failure,
        total: studentRecords.length,
        successRate: successRate.toFixed(1),
        chartData: [
            { label: 'Success', value: success, color: 'rgb(34, 197, 94)' },
            { label: 'Failure', value: failure, color: 'rgb(239, 68, 68)' },
        ]
    }
  }, [selectedStudentId, records]);

  const renderAdminView = () => (
    <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-blue-400">{adminAnalytics.totalStudents}</p><p className="text-slate-400">Total Students Registered</p></div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-green-400">{adminAnalytics.attendanceRate}%</p><p className="text-slate-400">Overall Success Rate</p></div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-amber-400">{adminAnalytics.anomalies.length}</p><p className="text-slate-400">Students with Anomalies</p></div>
        </div>
         {adminAnalytics.anomalies.length > 0 && (
            <div className="bg-amber-900/50 border border-amber-500/50 text-amber-300 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg">Anomaly Alert</h3>
                <p>Students with multiple consecutive failed attempts: {adminAnalytics.anomalies.map(a => `${a.name} (${a.count})`).join(', ')}.</p>
            </div>
        )}
        <h3 className="text-xl font-semibold mb-4">Student Roster</h3>
        <div className="overflow-x-auto">
            <div className="min-w-full bg-slate-800 border border-slate-700 rounded-lg table-striped">
                <div className="grid grid-cols-6 font-semibold text-slate-400 p-3 border-b border-slate-700">
                    <div>Name</div>
                    <div>Student ID</div>
                    <div className="text-center">Check-ins</div>
                    <div className="text-center">Success Rate</div>
                    <div>Last Activity</div>
                    <div className="text-right">Actions</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {students.length === 0 ? (
                         <p className="text-center text-slate-500 p-8">No students registered yet.</p>
                    ) : students.map(student => {
                        const recs = records.filter(r => r.studentId === student.id);
                        const success = recs.filter(r => r.status === 'SUCCESS').length;
                        const rate = recs.length > 0 ? (success / recs.length) * 100 : 0;
                        const lastRecord = recs.length > 0 ? new Date([...recs].sort((a,b) => b.timestamp - a.timestamp)[0].timestamp).toLocaleString() : 'N/A';
                        return (
                            <div key={student.id} className="grid grid-cols-6 p-3 border-b border-slate-800 items-center text-slate-400">
                                <div className="font-medium text-slate-200 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><UserIcon className="w-5 h-5 text-slate-400" /></div>
                                    {student.name}
                                </div>
                                <div>{student.studentIdNumber}</div>
                                <div className="text-center">{recs.length}</div>
                                <div className="text-center">{rate.toFixed(1)}%</div>
                                <div>{lastRecord}</div>
                                <div className="text-right">
                                    <button 
                                        onClick={() => onDeleteStudent(student.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                        aria-label={`Delete student ${student.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
  );

  const renderStudentView = () => (
     <div className="animate-fade-in">
        {loggedInUser.role === 'ADMIN' && (
            <select 
                onChange={e => setSelectedStudentId(e.target.value)} 
                value={selectedStudentId || ''}
                className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-md p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" disabled>-- Select a Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentIdNumber})</option>)}
            </select>
        )}

        {!selectedStudentId && students.length > 0 && <p className="text-slate-400">Please select a student to view their attendance.</p>}
        {students.length === 0 && <p className="text-slate-400">No students have been registered yet.</p>}

        {studentData && (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-blue-400">{studentData.total}</p><p className="text-slate-400">Total Check-ins</p></div>
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-green-400">{studentData.successRate}%</p><p className="text-slate-400">Your Success Rate</p></div>
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg"><p className="text-3xl font-bold text-red-400">{studentData.failure}</p><p className="text-slate-400">Failed Attempts</p></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Your Attendance Breakdown</h3>
                    <BarChart data={studentData.chartData} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                    <div className="min-w-full bg-slate-800 border border-slate-700 rounded-lg table-striped">
                        <div className="grid grid-cols-3 font-semibold text-slate-400 p-3 border-b border-slate-700">
                           <div>Lecture</div>
                           <div>Timestamp</div>
                           <div className="text-center">Status</div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {[...studentData.records].reverse().map(record => (
                                <div key={record.id} className="grid grid-cols-3 p-3 border-b border-slate-800 items-center text-slate-400">
                                    <div className="font-medium text-slate-200">{record.lectureTitle}</div>
                                    <div>{new Date(record.timestamp).toLocaleString()}</div>
                                    <div className="flex justify-center">
                                     {record.status === 'SUCCESS' ? 
                                        <span className="text-xs font-semibold bg-green-500/10 text-green-300 px-2.5 py-1 rounded-full">Success</span> : 
                                        <span className="text-xs font-semibold bg-red-500/10 text-red-300 px-2.5 py-1 rounded-full">Failure</span>
                                      }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
     </div>
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 w-full max-w-6xl">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4">
          <BackArrowIcon />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{loggedInUser.role === 'ADMIN' ? 'Admin & Student Portal' : 'My Attendance Portal'}</h2>
          <p className="text-slate-400">Monitor and review attendance records.</p>
        </div>
      </div>
      
      {loggedInUser.role === 'ADMIN' && (
        <div className="flex mb-6 bg-slate-700/50 p-1 rounded-md max-w-xs">
            <button onClick={() => setView('ADMIN')} className={`w-1/2 p-2 rounded text-sm font-semibold transition-colors ${view === 'ADMIN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Admin View</button>
            <button onClick={() => setView('STUDENT')} className={`w-1/2 p-2 rounded text-sm font-semibold transition-colors ${view === 'STUDENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Student View</button>
        </div>
      )}

      {view === 'ADMIN' ? renderAdminView() : renderStudentView()}
    </div>
  );
};
