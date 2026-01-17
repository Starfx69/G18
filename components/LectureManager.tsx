
import React, { useState } from 'react';
import type { Lecture, AttendanceRecord } from '../types.ts';
import { BackArrowIcon, BookOpenIcon, UserIcon } from './Icons.tsx';

interface LectureManagerProps {
  lectures: Lecture[];
  records: AttendanceRecord[];
  onAddLecture: (lecture: Lecture) => void;
  onUpdateLectureStatus: (lectureId: string, status: Lecture['status']) => void;
  onBack: () => void;
}

export const LectureManager: React.FC<LectureManagerProps> = ({ lectures, records, onAddLecture, onUpdateLectureStatus, onBack }) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && courseCode.trim()) {
      const newLecture: Lecture = {
        id: self.crypto.randomUUID(),
        title,
        courseCode,
        createdAt: Date.now(),
        status: 'UPCOMING',
      };
      onAddLecture(newLecture);
      setTitle('');
      setCourseCode('');
    }
  };
  
  const getStatusButton = (lecture: Lecture) => {
      switch(lecture.status) {
          case 'UPCOMING':
              return <button onClick={() => onUpdateLectureStatus(lecture.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">Start Session</button>;
          case 'ACTIVE':
              return <button onClick={() => onUpdateLectureStatus(lecture.id, 'COMPLETED')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">End Session</button>;
          case 'COMPLETED':
              return <span className="text-xs font-semibold text-slate-500">Completed</span>
      }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 w-full max-w-6xl">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4">
          <BackArrowIcon />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manage Lectures & Sessions</h2>
          <p className="text-slate-400">Create and control attendance sessions.</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">Create New Lecture</h3>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-slate-400 mb-1 block">Lecture Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to AI"
              className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-slate-400 mb-1 block">Course Code</label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., CS101"
              className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-slate-600"
            disabled={!title.trim() || !courseCode.trim()}
          >
            Create
          </button>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4">Existing Lectures</h3>
       <div className="overflow-x-auto">
        <div className="min-w-full bg-slate-800 border border-slate-700 rounded-lg table-striped">
          <div className="grid grid-cols-5 font-semibold text-slate-400 p-3 border-b border-slate-700">
            <div>Title</div>
            <div>Course Code</div>
            <div className="text-center">Check-ins</div>
            <div className="text-center">Status</div>
            <div className="text-center">Actions</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
             {lectures.length === 0 ? (
                <p className="text-center text-slate-500 p-8">No lectures created yet.</p>
            ) : (
                [...lectures].reverse().map(lecture => {
                    const checkIns = records.filter(r => r.lectureId === lecture.id && r.status === 'SUCCESS').length;
                    let statusBadge;
                    switch(lecture.status) {
                        case 'ACTIVE': statusBadge = <span className="text-xs font-semibold bg-green-500/10 text-green-300 px-2.5 py-1 rounded-full">Active</span>; break;
                        case 'COMPLETED': statusBadge = <span className="text-xs font-semibold bg-slate-500/10 text-slate-400 px-2.5 py-1 rounded-full">Completed</span>; break;
                        default: statusBadge = <span className="text-xs font-semibold bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-full">Upcoming</span>; break;
                    }
                    return (
                        <div key={lecture.id} className="grid grid-cols-5 p-3 border-b border-slate-800 items-center text-slate-400">
                            <div className="font-medium text-slate-200">{lecture.title}</div>
                            <div>{lecture.courseCode}</div>
                            <div className="text-center flex items-center justify-center gap-2">
                                <UserIcon className="w-4 h-4 text-slate-500"/>
                                {checkIns}
                            </div>
                            <div className="flex justify-center">{statusBadge}</div>
                            <div className="flex justify-center">{getStatusButton(lecture)}</div>
                        </div>
                    );
                })
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
