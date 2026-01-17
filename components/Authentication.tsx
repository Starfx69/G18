
import React, { useState, useEffect } from 'react';
import type { Student, AttendanceRecord, Lecture } from '../types.ts';
import { WebcamView } from './WebcamView.tsx';
import { BackArrowIcon, CheckCircleIcon, XCircleIcon, FingerprintIcon, IdCardIcon, FaceIdIcon, BookOpenIcon } from './Icons.tsx';
import { authenticateFace, livenessCheck, compareIdCards } from './cv-utils.ts';

interface AttendanceProps {
  students: Student[];
  lectures: Lecture[];
  onMarkAttendance: (record: AttendanceRecord) => void;
  onBack: () => void;
  loggedInStudent?: Student;
}

type AttendanceStep = 'LECTURE_SELECT' | 'ID_INPUT' | 'FACE' | 'LIVENESS' | 'ID_CARD' | 'FINGERPRINT' | 'RESULT';
type LivenessChallenge = 'TILT_LEFT' | 'TILT_RIGHT';
type ResultStatus = 'SUCCESS' | 'FAILURE';

export const Attendance: React.FC<AttendanceProps> = ({ students, lectures, onMarkAttendance, onBack, loggedInStudent }) => {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [step, setStep] = useState<AttendanceStep>('LECTURE_SELECT');
  const [result, setResult] = useState<ResultStatus | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(loggedInStudent || null);
  const [enteredId, setEnteredId] = useState('');
  const [idError, setIdError] = useState('');
  
  const [livenessChallenge] = useState<LivenessChallenge>(() => Math.random() > 0.5 ? 'TILT_LEFT' : 'TILT_RIGHT');
  const [livenessMessage, setLivenessMessage] = useState('');

  const handleBack = () => {
    if (step === 'ID_INPUT' || step === 'FACE') {
      setStep('LECTURE_SELECT');
      setIdentifiedStudent(loggedInStudent || null);
    } else {
      onBack();
    }
  };

  const handleFailure = (reason: string, student: Student | null = identifiedStudent) => {
    setFailureReason(reason);
    setResult('FAILURE');
    setStep('RESULT');
    if (selectedLecture) {
        onMarkAttendance({
            id: self.crypto.randomUUID(),
            studentId: student?.id || 'UNKNOWN',
            studentName: student?.name || 'Unknown',
            lectureId: selectedLecture.id,
            lectureTitle: selectedLecture.title,
            timestamp: Date.now(),
            status: 'FAILURE',
            failureReason: reason,
        });
    }
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setStep(loggedInStudent ? 'FACE' : 'ID_INPUT');
  };

  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdError('');
    const student = students.find(s => s.studentIdNumber === enteredId);
    if (student) {
        setIdentifiedStudent(student);
        setStep('FACE');
    } else {
        setIdError('No student found with that ID number.');
    }
  };

  const handleFaceScan = async (imageData: string) => {
    if (!identifiedStudent) return handleFailure("Logic error: student not identified.");
    setIsLoading(true);
    const result = await authenticateFace(imageData, identifiedStudent);
    setIsLoading(false);

    if (result.success) {
      setStep('LIVENESS');
    } else {
      handleFailure('Face not recognized.', identifiedStudent);
    }
  };
  
  const handleLivenessCheck = async (imageData: string) => {
      if (!identifiedStudent) return handleFailure("Logic error: student not identified.");
      setIsLoading(true);
      setLivenessMessage("Verifying...");
      const isLive = await livenessCheck(imageData, livenessChallenge);
      setIsLoading(false);
      if (isLive) {
          setStep('ID_CARD');
      } else {
          setLivenessMessage("Liveness check failed. Please try again.");
          setTimeout(() => setLivenessMessage(''), 2000);
      }
  };

  const handleIdScan = async (imageData: string) => {
    if (!identifiedStudent) return handleFailure("Logic error: student not identified.");
    setIsLoading(true);
    const isMatch = await compareIdCards(imageData, identifiedStudent.idCardSample);
    setIsLoading(false);

    if (isMatch) {
      setStep('FINGERPRINT');
    } else {
      handleFailure('Student ID card does not match.', identifiedStudent);
    }
  };
  
  const handleFingerprintScan = () => {
      setIsLoading(true);
      setTimeout(() => {
          const isSuccess = Math.random() > 0.1; 
          if (isSuccess && identifiedStudent && selectedLecture) {
            setResult('SUCCESS');
            setStep('RESULT');
             onMarkAttendance({
                id: self.crypto.randomUUID(),
                studentId: identifiedStudent.id,
                studentName: identifiedStudent.name,
                lectureId: selectedLecture.id,
                lectureTitle: selectedLecture.title,
                timestamp: Date.now(),
                status: 'SUCCESS'
            });
          } else {
              handleFailure('Fingerprint not recognized.', identifiedStudent);
          }
          setIsLoading(false);
      }, 1500);
  }

  const StepIndicator = ({ currentStep }: { currentStep: AttendanceStep }) => {
    const steps: { name: AttendanceStep, label: string, icon: React.ReactElement }[] = [
      { name: 'FACE', label: 'Face Scan', icon: <FaceIdIcon className="w-6 h-6"/> },
      { name: 'LIVENESS', label: 'Liveness', icon: <CheckCircleIcon className="w-6 h-6"/> },
      { name: 'ID_CARD', label: 'ID Scan', icon: <IdCardIcon className="w-6 h-6"/> },
      { name: 'FINGERPRINT', label: 'Fingerprint', icon: <FingerprintIcon className="w-6 h-6"/> }
    ];
    const currentIndex = steps.findIndex(s => s.name === currentStep);

    return (
        <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-8">
            {steps.map((s, index) => (
                <React.Fragment key={s.name}>
                    <div className="flex flex-col items-center gap-2 z-10 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index <= currentIndex ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                            {s.icon}
                        </div>
                        <span className={`text-xs font-medium ${index <= currentIndex ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${index < currentIndex ? 'bg-blue-500' : 'bg-slate-700'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
  };
  
  const renderContent = () => {
    const activeLectures = lectures.filter(l => l.status === 'ACTIVE');

    switch(step) {
      case 'LECTURE_SELECT':
        return (
            <div className="w-full animate-fade-in">
                <h3 className="text-xl font-semibold text-center text-slate-200 mb-4">Select an Active Session</h3>
                {activeLectures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeLectures.map(lecture => (
                            <button key={lecture.id} onClick={() => handleLectureSelect(lecture)} className="text-left p-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500 transition-all transform hover:-translate-y-1">
                                <p className="font-bold text-lg text-slate-100">{lecture.title}</p>
                                <p className="text-sm text-slate-400">{lecture.courseCode}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 p-8">There are no active sessions right now.</p>
                )}
            </div>
        );
      case 'ID_INPUT':
        return (
             <form onSubmit={handleIdSubmit} className="flex flex-col gap-4 animate-fade-in w-full max-w-sm mx-auto">
                 <h3 className="text-xl font-semibold text-center text-slate-200 mb-2">Enter Student ID</h3>
                <input
                    type="text"
                    value={enteredId}
                    onChange={(e) => setEnteredId(e.target.value)}
                    placeholder="Student ID Number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center text-lg"
                    required
                />
                {idError && <p className="text-red-400 text-sm text-center">{idError}</p>}
                <button
                    type="submit"
                    disabled={!enteredId.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
                >
                    Verify ID & Proceed
                </button>
            </form>
        );
      case 'FACE':
        return (
            <div className="animate-fade-in">
                <WebcamView onCapture={handleFaceScan} captureLabel="Scan Face for Authentication" />
            </div>
        );
      case 'LIVENESS':
          const challengeText = livenessChallenge === 'TILT_LEFT' ? 'Please Tilt Your Head to the LEFT' : 'Please Tilt Your Head to the RIGHT';
          return (
             <div className="animate-fade-in text-center">
                <p className="font-bold text-xl mb-4 text-amber-400">{challengeText}</p>
                <WebcamView onCapture={handleLivenessCheck} captureLabel="Confirm Liveness" />
                {livenessMessage && <p className="text-center text-red-400 mt-2">{livenessMessage}</p>}
             </div>
          );
      case 'ID_CARD':
        return (
            <div className="animate-fade-in">
                <WebcamView onCapture={handleIdScan} captureLabel="Scan ID Card to Verify" />
            </div>
        );
      case 'FINGERPRINT':
          return (
            <div className="text-center flex flex-col items-center gap-4 animate-fade-in">
                <h3 className="text-xl font-semibold text-slate-200 mb-2">Final Step: Fingerprint Verification</h3>
                <p className="text-slate-400">Place your finger on the scanner.</p>
                <button onClick={handleFingerprintScan} className="relative w-48 h-64 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700 hover:border-blue-500 transition-colors group">
                    <FingerprintIcon className="w-24 h-24 text-slate-500 group-hover:text-blue-400 transition-colors animate-pulse" />
                </button>
            </div>
          );
      case 'RESULT':
        if (result === 'SUCCESS') return (
          <div className="text-center flex flex-col items-center gap-4 animate-fade-in">
            <CheckCircleIcon className="h-20 w-20 text-green-500" />
            <h3 className="text-3xl font-bold text-slate-100">Attendance Marked Successfully</h3>
            <p className="text-slate-300 text-lg">Welcome, {identifiedStudent?.name}!</p>
            <p className="text-slate-400">Checked in for: <span className="font-semibold text-slate-300">{selectedLecture?.title}</span></p>
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md mt-4 transition-all shadow-lg">
              Done
            </button>
          </div>
        );
        return (
          <div className="text-center flex flex-col items-center gap-4 animate-fade-in">
            <XCircleIcon className="h-20 w-20 text-red-500" />
            <h3 className="text-3xl font-bold text-slate-100">Authentication Failed</h3>
            <p className="text-slate-300 bg-red-900/50 px-3 py-1 rounded-md border border-red-500/50">{failureReason}</p>
             <button onClick={onBack} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-md mt-4 transition-all shadow-lg">
              Back to Menu
            </button>
          </div>
        );
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 w-full max-w-4xl">
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4 disabled:opacity-50" disabled={isLoading}>
          <BackArrowIcon />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Mark Attendance</h2>
          <p className="text-slate-400">
            {selectedLecture ? `For: ${selectedLecture.title}` : 'Please select a session'}
          </p>
        </div>
      </div>
      {step !== 'RESULT' && step !== 'ID_INPUT' && step !== 'LECTURE_SELECT' && <StepIndicator currentStep={step} />}
      <div className="relative min-h-[350px] flex items-center justify-center">
        {renderContent()}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-slate-300 font-semibold">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
