import React, { useState } from 'react';

export interface FirstTimeSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function FirstTimeSetup({ onComplete, onSkip, isOpen, onClose }: FirstTimeSetupProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Farmers-Boot',
      description: "Let's set up your farm management system.",
    },
    {
      title: 'Create Your First Farm',
      description: 'Add your farm details to get started.',
    },
    {
      title: "You're All Set!",
      description: 'Your farm is ready. Start managing your operations.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{steps[step]?.title}</h2>
          <p className="text-gray-600 mt-2">{steps[step]?.description}</p>
        </div>

        <div className="flex justify-between mt-6">
          {onSkip && (
            <button onClick={onSkip} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Skip
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${i === step ? 'bg-green-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FirstTimeSetup;
