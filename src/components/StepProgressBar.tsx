import React from 'react';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitles
}) => {
  const currentTitle = stepTitles[currentStep - 1] || '';
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-xs">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
              Etapa {currentStep} de {totalSteps}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {currentTitle}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {progressPercent}%
          </span>
        </div>

        {/* Progress line */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step dots for quick visual feedback */}
        <div className="flex justify-between items-center mt-2 px-0.5">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                title={`Etapa ${stepNum}: ${title}`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
