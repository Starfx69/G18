
import React, { useState, useEffect } from 'react';
import type { AppState, Student, AttendanceRecord, User, Admin, Lecture } from './types.ts';
import { Registration } from './components/Registration.tsx';
import { Attendance } from './components/Authentication.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Portal } from './components/Portal.tsx';
import { Login } from './components/Login.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { AdminRegistration } from './components/AdminRegistration.tsx';
import { LectureManager } from './components/LectureManager.tsx';
import { UserPlusIcon, ClipboardCheckIcon, LayoutDashboardIcon, ShieldCheckIcon, UserIcon, BackArrowIcon, BookOpenIcon } from './components/Icons.tsx';

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'ADMIN_LOGIN' | 'ADMIN_REGISTER'>('LOGIN');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const [isCvReady, setIsCvReady] = useState(false);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('iam-students');
      if (storedStudents) setStudents(JSON.parse(storedStudents));
      
      const storedRecords = localStorage.getItem('iam-attendance-records');
      if (storedRecords) setAttendanceRecords(JSON.parse(storedRecords));

      const storedAdmin = localStorage.getItem('iam-admin');
      if (storedAdmin) setAdminUser(JSON.parse(storedAdmin));

      const storedLectures = localStorage.getItem('iam-lectures');
      if (storedLectures) setLectures(JSON.parse(storedLectures));

    } catch (error) {      
        console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    const onCvReady = () => setIsCvReady(true);
    document.body.addEventListener('opencv-ready', onCvReady);
    if ((window as any).cv) onCvReady();
    return () => document.body.removeEventListener('opencv-ready', onCvReady);
  }, []);
  
  const persistLectures = (updatedLectures: Lecture[]) => {
      setLectures(updatedLectures);
      localStorage.setItem('iam-lectures', JSON.stringify(updatedLectures));
  };

  const handleAddLecture = (lecture: Lecture) => {
      persistLectures([...lectures, lecture]);
  };
  
  const handleUpdateLectureStatus = (lectureId: string, status: Lecture['status']) => {
      const updatedLectures = lectures.map(l => l.id === lectureId ? {...l, status} : l);
      persistLectures(updatedLectures);
  };

  const handleSaveStudent = (student: Student) => {
    const updatedStudents = [...students.filter(s => s.studentIdNumber !== student.studentIdNumber), student];
    setStudents(updatedStudents);
    localStorage.setItem('iam-students', JSON.stringify(updatedStudents));
  };
  
  const handleAdminRegistration = (admin: Admin) => {
    setAdminUser(admin);
    localStorage.setItem('iam-admin', JSON.stringify(admin));
    alert('Admin registration successful! You can now log in.');
    setAuthView('ADMIN_LOGIN');
  };

  const handlePreLoginRegister = (student: Student) => {
    handleSaveStudent(student);
    alert('Registration successful! You can now log in with your Student ID.');
    setAuthView('LOGIN');
  };
  
  const handleAdminRegisterStudent = (student: Student) => {
    handleSaveStudent(student);
    setAppState('IDLE');
  };

  const handleMarkAttendance = (record: AttendanceRecord) => {
    const updatedRecords = [...attendanceRecords, record];
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('iam-attendance-records', JSON.stringify(updatedRecords));
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student and all their records? This action cannot be undone.')) {
        const updatedStudents = students.filter(s => s.id !== studentId);
        const updatedRecords = attendanceRecords.filter(r => r.studentId !== studentId);
        
        setStudents(updatedStudents);
        setAttendanceRecords(updatedRecords);

        localStorage.setItem('iam-students', JSON.stringify(updatedStudents));
        localStorage.setItem('iam-attendance-records', JSON.stringify(updatedRecords));
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setAppState('IDLE');
    setAuthView('LOGIN');
  };

  if (!loggedInUser) {
    switch(authView) {
        case 'REGISTER':
            return <Registration 
                        onRegister={handlePreLoginRegister} 
                        onBack={() => setAuthView('LOGIN')}
                        isPreLogin={true}
                    />;
        case 'ADMIN_LOGIN':
             return <AdminLogin
                        onLogin={setLoggedInUser}
                        onBack={() => setAuthView('LOGIN')}
                        onNavigateToRegister={() => setAuthView('ADMIN_REGISTER')}
                        adminUser={adminUser}
                    />;
        case 'ADMIN_REGISTER':
            return <AdminRegistration
                        onRegister={handleAdminRegistration}
                        onBack={() => setAuthView('ADMIN_LOGIN')}
                        hasAdmin={!!adminUser}
                    />;
        case 'LOGIN':
        default:
             return <Login 
                        onLogin={setLoggedInUser} 
                        students={students} 
                        onNavigateToRegister={() => setAuthView('REGISTER')}
                        onNavigateToAdminLogin={() => setAuthView('ADMIN_LOGIN')}
                    />;
    }
  }

  const renderContent = () => {
    if (!isCvReady) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 text-lg">Loading Vision Engine...</p>
        </div>
      );
    }

    switch (appState) {
      case 'REGISTERING':
        return <Registration onRegister={handleAdminRegisterStudent} onBack={() => setAppState('IDLE')} />;
      case 'MANAGING_LECTURES':
        return <LectureManager 
                    lectures={lectures} 
                    records={attendanceRecords}
                    onAddLecture={handleAddLecture}
                    onUpdateLectureStatus={handleUpdateLectureStatus}
                    onBack={() => setAppState('IDLE')} 
                />;
      case 'MARKING_ATTENDANCE':
        return <Attendance 
                    students={students} 
                    lectures={lectures}
                    onMarkAttendance={handleMarkAttendance} 
                    onBack={() => setAppState('IDLE')} 
                    loggedInStudent={loggedInUser.role === 'STUDENT' ? loggedInUser.student : undefined}
                />;
      case 'VIEWING_DASHBOARD':
        return <Dashboard records={attendanceRecords} onBack={() => setAppState('IDLE')} />;
      case 'VIEWING_PORTAL':
        return <Portal 
                    students={students} 
                    records={attendanceRecords} 
                    onBack={() => setAppState('IDLE')} 
                    loggedInUser={loggedInUser} 
                    onDeleteStudent={handleDeleteStudent}
                />;
      case 'IDLE':
      default:
        const isAdmin = loggedInUser.role === 'ADMIN';
        const gridCols = isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-2';
        return (
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-100">
                Welcome, {loggedInUser.role === 'STUDENT' ? loggedInUser.student.name : 'Admin'}
            </h1>
            <p className="text-slate-400 mt-4 mb-12 text-lg max-w-2xl mx-auto">Please select an option below to get started.</p>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6 max-w-6xl mx-auto`}>
              {isAdmin && (
                <>
                  <button onClick={() => setAppState('REGISTERING')} className="group flex flex-col items-center justify-center gap-4 bg-slate-800/50 border border-slate-700 p-6 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-1">
                      <UserPlusIcon className="w-10 h-10 text-blue-400" />
                      <span className="font-semibold text-lg text-slate-200">Register Student</span>
                  </button>
                  <button onClick={() => setAppState('MANAGING_LECTURES')} className="group flex flex-col items-center justify-center gap-4 bg-slate-800/50 border border-slate-700 p-6 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-1">
                      <BookOpenIcon className="w-10 h-10 text-blue-400" />
                      <span className="font-semibold text-lg text-slate-200">Manage Lectures</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setAppState('MARKING_ATTENDANCE')}
                disabled={students.length === 0 || !lectures.some(l => l.status === 'ACTIVE')}
                className="group flex flex-col items-center justify-center gap-4 bg-slate-800/50 border border-slate-700 p-6 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                 <ClipboardCheckIcon className="w-10 h-10 text-blue-400" />
                <span className="font-semibold text-lg text-slate-200">Mark Attendance</span>
              </button>
              {isAdmin && (
                <button onClick={() => setAppState('VIEWING_DASHBOARD')} className="group flex flex-col items-center justify-center gap-4 bg-slate-800/50 border border-slate-700 p-6 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-1">
                    <LayoutDashboardIcon className="w-10 h-10 text-blue-400" />
                    <span className="font-semibold text-lg text-slate-200">System Dashboard</span>
                </button>
              )}
               <button onClick={() => setAppState('VIEWING_PORTAL')} className="group flex flex-col items-center justify-center gap-4 bg-slate-800/50 border border-slate-700 p-6 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-1">
                 <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
                <span className="font-semibold text-lg text-slate-200">{isAdmin ? 'Admin & Student Portal' : 'My Portal'}</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-200 selection:bg-blue-500/30">
        <header className="bg-slate-800/50 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-slate-100">FaceAuth Pro</h1>
            {loggedInUser && (
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <span>{loggedInUser.role === 'STUDENT' ? loggedInUser.student.name : 'Administrator'}</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
                        <BackArrowIcon className="w-4 h-4 rotate-180" />
                        Logout
                    </button>
                </div>
            )}
        </header>
        <main className="p-4 sm:p-6 md:p-8 flex items-center justify-center" style={{minHeight: 'calc(100vh - 73px)'}}>
            <div className="w-full max-w-6xl z-10">
                {renderContent()}
            </div>
        </main>
    </div>
  );
}
