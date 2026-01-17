
export type AppState = 'IDLE' | 'REGISTERING' | 'MARKING_ATTENDANCE' | 'VIEWING_DASHBOARD' | 'VIEWING_PORTAL' | 'MANAGING_LECTURES';

export interface Student {
    id: string;
    name: string;
    studentIdNumber: string;
    faceSamples: string[];
    idCardSample: string;
}

export interface Lecture {
    id: string;
    title: string;
    courseCode: string;
    createdAt: number;
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    lectureId: string;
    lectureTitle: string;
    timestamp: number;
    status: 'SUCCESS' | 'FAILURE';
    failureReason?: string;
}

export interface Admin {
    username: string;
    password: string;
}

export type User = { role: 'ADMIN' } | { role: 'STUDENT', student: Student };
