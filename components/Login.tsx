
import React, { useState } from 'react';
import type { Student, User } from '../types.ts';

interface LoginProps {
    onLogin: (user: User) => void;
    students: Student[];
    onNavigateToRegister: () => void;
    onNavigateToAdminLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, students, onNavigateToRegister, onNavigateToAdminLogin }) => {
    const [studentId, setStudentId] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const student = students.find(s => s.studentIdNumber === studentId);
        if (student) {
            onLogin({ role: 'STUDENT', student });
        } else {
            setError('Invalid Student ID. Please try again or register an account.');
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl md:text-5xl font-bold text-slate-100">FaceAuth Pro</h1>
                     <p className="text-slate-400 mt-2">Student Portal Login</p>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Student ID Number</label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your student ID"
                                required
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}

                        <button
                            type="submit"
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
                        >
                            Login
                        </button>
                    </form>
                    
                    <div className="text-center text-sm text-slate-400 mt-6 space-y-2">
                         <p>
                            New student?{' '}
                            <button onClick={onNavigateToRegister} className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none">
                                Register an account
                            </button>
                        </p>
                        <p>
                            Are you an administrator?{' '}
                            <button onClick={onNavigateToAdminLogin} className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none">
                                Login here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
