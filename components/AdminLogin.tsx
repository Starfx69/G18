
import React, { useState } from 'react';
import type { User, Admin } from '../types.ts';

interface AdminLoginProps {
    onLogin: (user: User) => void;
    onBack: () => void;
    onNavigateToRegister: () => void;
    adminUser: Admin | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack, onNavigateToRegister, adminUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!adminUser) {
            setError('No admin account found. Please register.');
            return;
        }

        if (username === adminUser.username && password === adminUser.password) {
            onLogin({ role: 'ADMIN' });
        } else {
            setError('Invalid admin credentials.');
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl md:text-5xl font-bold text-slate-100">FaceAuth Pro</h1>
                     <p className="text-slate-400 mt-2">Administrator Login</p>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}

                        <button
                            type="submit"
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
                        >
                            Login as Admin
                        </button>
                    </form>
                    
                    <div className="text-center text-sm text-slate-400 mt-6 space-y-2">
                        <p>
                            <button onClick={onNavigateToRegister} className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none">
                                {adminUser ? 'Manage Admin Account' : 'Create an admin account'}
                            </button>
                        </p>
                         <p>
                            <button onClick={onBack} className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none">
                                Back to Student Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
