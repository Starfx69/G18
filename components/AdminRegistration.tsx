
import React, { useState } from 'react';
import type { Admin } from '../types.ts';

interface AdminRegistrationProps {
    onRegister: (admin: Admin) => void;
    onBack: () => void;
    hasAdmin: boolean;
}

export const AdminRegistration: React.FC<AdminRegistrationProps> = ({ onRegister, onBack, hasAdmin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (hasAdmin) {
            setError('An admin account already exists. Multiple admin accounts are not supported in this version.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        
        onRegister({ username, password });
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl md:text-5xl font-bold text-slate-100">FaceAuth Pro</h1>
                     <p className="text-slate-400 mt-2">Create Administrator Account</p>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 shadow-2xl">
                    <form onSubmit={handleRegister} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Admin Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Choose a username"
                                required
                                disabled={hasAdmin}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Create a password"
                                required
                                disabled={hasAdmin}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1 block">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm your password"
                                required
                                disabled={hasAdmin}
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}

                        <button
                            type="submit"
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
                            disabled={hasAdmin}
                        >
                            {hasAdmin ? 'Admin Account Exists' : 'Register Admin'}
                        </button>
                    </form>
                    
                    <p className="text-center text-sm text-slate-400 mt-6">
                        <button onClick={onBack} className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none">
                            Back to Admin Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
