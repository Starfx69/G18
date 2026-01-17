
import React, { useState, useRef, useEffect } from 'react';
import type { Student } from '../types.ts';
import { WebcamView } from './WebcamView.tsx';
import { BackArrowIcon, UserIcon, FaceIdIcon, IdCardIcon, CheckCircleIcon } from './Icons.tsx';
import { processImageForRegistration } from './cv-utils.ts';

interface RegistrationProps {
  onRegister: (student: Student) => void;
  onBack: () => void;
  isPreLogin?: boolean;
}

type RegistrationStep = 'DETAILS' | 'FACE' | 'ID_CARD' | 'DONE';
const TOTAL_FACE_CAPTURES = 3;

const StepIndicator = ({ currentStep }: { currentStep: RegistrationStep }) => {
    const steps = [
      { id: 'DETAILS', title: 'Details' },
      { id: 'FACE', title: 'Face Scan' },
      { id: 'ID_CARD', title: 'ID Card' },
      { id: 'DONE', title: 'Complete' }
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex items-center w-full max-w-lg mx-auto mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-2 z-10 text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index <= currentIndex ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                           {index < currentIndex ? <CheckCircleIcon className="w-6 h-6"/> : (index + 1) }
                        </div>
                        <span className={`text-xs font-medium ${index <= currentIndex ? 'text-slate-200' : 'text-slate-500'}`}>{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 transition-colors duration-300 ${index < currentIndex ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


export const Registration: React.FC<RegistrationProps> = ({ onRegister, onBack, isPreLogin = false }) => {
  const [step, setStep] = useState<RegistrationStep>('DETAILS');
  const [name, setName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [faceSamples, setFaceSamples] = useState<string[]>([]);
  const [idCardSample, setIdCardSample] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  
  const webcamViewRef = useRef<{ triggerCapture: () => void }>(null);

  const handleFaceCapture = (imageData: string) => {
    setIsProcessingFace(true);
    setErrorMessage(null);

    // Allow UI to update to "processing" state before blocking main thread
    setTimeout(async () => {
      const processedFace = await processImageForRegistration(imageData);
      if (processedFace) {
        setFaceSamples(prev => [...prev, processedFace]);
      } else {
        setErrorMessage("No face detected. Please position yourself in the center.");
        setTimeout(() => {
          setErrorMessage(null);
        }, 2500);
      }
      setIsProcessingFace(false);
    }, 50);
  };

  const handleIdCapture = (imageData: string) => {
    setIdCardSample(imageData);
    setStep('DONE');
  };

  const handleFinalizeRegistration = () => {
    if (name && studentIdNumber && faceSamples.length === TOTAL_FACE_CAPTURES && idCardSample) {
        const newStudent: Student = {
            id: self.crypto.randomUUID(),
            name,
            studentIdNumber,
            faceSamples,
            idCardSample
        };
        onRegister(newStudent);
    }
  };
  
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && studentIdNumber.trim()) setStep('FACE');
  };

  // Main timer & capture loop effect
  useEffect(() => {
    if (step === 'FACE' && faceSamples.length < TOTAL_FACE_CAPTURES && !isProcessingFace && !errorMessage) {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    webcamViewRef.current?.triggerCapture();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [step, faceSamples.length, isProcessingFace, errorMessage]);

  // Effect to reset countdown display for the next cycle
  useEffect(() => {
    if (step === 'FACE') {
      setCountdown(3);
    }
  }, [step, faceSamples.length, errorMessage]);

  // Effect to automatically move to the next step after all face captures are done
  useEffect(() => {
    if (faceSamples.length === TOTAL_FACE_CAPTURES && step === 'FACE') {
        setTimeout(() => setStep('ID_CARD'), 1000);
    }
  }, [faceSamples, step]);

  const renderStepContent = () => {
    switch (step) {
      case 'DETAILS':
        return (
          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 animate-fade-in w-full max-w-sm mx-auto">
             <h3 className="text-xl font-semibold text-center text-slate-200 mb-2">Enter Student Details</h3>
            <div>
                <label className="text-sm font-medium text-slate-400 mb-1 block">Full Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                />
            </div>
             <div>
                <label className="text-sm font-medium text-slate-400 mb-1 block">Student ID Number</label>
                <input
                    type="text"
                    value={studentIdNumber}
                    onChange={(e) => setStudentIdNumber(e.target.value)}
                    placeholder="e.g., 987654"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={!name.trim() || !studentIdNumber.trim()}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
            >
                Next Step
            </button>
          </form>
        );
      case 'FACE':
        return (
            <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-center text-slate-200 mb-4">Prepare for Face Scan</h3>
                <div className="relative max-w-lg mx-auto">
                    <WebcamView onCapture={handleFaceCapture} captureLabel="" ref={webcamViewRef} hideCaptureButton={true}/>
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center p-4">
                        {isProcessingFace ? (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                                <p className="mt-3 font-semibold text-lg">Processing...</p>
                            </>
                        ) : errorMessage ? (
                            <p className="text-xl font-bold text-red-400">{errorMessage}</p>
                        ) : (
                            <>
                                <p className="text-lg">Capturing image {faceSamples.length + 1} of {TOTAL_FACE_CAPTURES}</p>
                                <p className="text-7xl font-bold drop-shadow-lg">{countdown > 0 ? countdown : '📸'}</p>
                                <p className="mt-2 text-slate-300">Please hold still and look at the camera.</p>
                            </>
                        )}
                    </div>
                </div>
                 <div className="mt-4 text-center max-w-lg mx-auto">
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(faceSamples.length / TOTAL_FACE_CAPTURES) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        );
      case 'ID_CARD':
          return (
            <div className="animate-fade-in">
                 <h3 className="text-xl font-semibold text-center text-slate-200 mb-4">Scan Student ID Card</h3>
                 <WebcamView onCapture={handleIdCapture} captureLabel="Capture ID Card" />
            </div>
          );
      case 'DONE':
          return (
            <div className="text-center flex flex-col items-center gap-4 animate-fade-in">
                <CheckCircleIcon className="w-16 h-16 text-green-500"/>
                <h3 className="text-2xl font-bold text-slate-100">Registration Complete</h3>
                 <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg text-left">
                    <p className="font-bold text-lg text-slate-200">{name}</p>
                    <p className="text-slate-400">Student ID: {studentIdNumber}</p>
                </div>
                <button onClick={handleFinalizeRegistration} className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 shadow-lg">
                    {isPreLogin ? 'Finish & Go to Login' : 'Finish & Return to Menu'}
                </button>
            </div>
          );
    }
  };
  
  const registrationContent = (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 w-full max-w-4xl flex flex-col items-center">
        <div className="flex w-full items-center mb-6 self-start">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-4">
            <BackArrowIcon />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-100">New Student Registration</h2>
                <p className="text-slate-400">Create your secure biometric profile.</p>
            </div>
        </div>
        <StepIndicator currentStep={step} />
        {renderStepContent()}
    </div>
  );

  if (isPreLogin) {
    return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4">
            {registrationContent}
        </div>
    );
  }

  return registrationContent;
};
