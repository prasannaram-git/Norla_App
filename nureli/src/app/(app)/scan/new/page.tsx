'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { ProgressStepper } from '@/components/progress-stepper';
import { UploadCard } from '@/components/scan/upload-card';
import { QuestionCard } from '@/components/scan/question-card';
import { LoadingAnalysisState } from '@/components/loading-states';
import { QUESTIONNAIRE_STEPS, DEFAULT_QUESTIONNAIRE } from '@/lib/questionnaire-config';
import { MOCK_SCAN_RESULT } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { ArrowLeft, ArrowRight, Send, Check, AlertCircle } from 'lucide-react';
import type { QuestionnairePayload } from '@/types/scan';

const IMAGE_STEPS = [
  {
    key: 'face',
    label: 'Face Photo',
    description: 'A clear, well-lit photo of your face',
    tips: [
      'Use natural lighting, face a window if possible',
      'Remove glasses and accessories',
      'Look directly at the camera',
      'No filters or heavy makeup',
    ],
  },
  {
    key: 'eye',
    label: 'Eye Photo',
    description: 'A close-up of one eye, clearly visible',
    tips: [
      'Open your eye wide and look at the camera',
      'Good lighting so sclera (white) is visible',
      'Hold phone close but keep focus sharp',
      'Avoid flash if possible',
    ],
  },
  {
    key: 'hand',
    label: 'Hand Photo',
    description: 'Photo of your palm and fingers in good light',
    tips: [
      'Spread fingers naturally',
      'Show nail beds clearly',
      'Use natural light',
      'Include palm if possible',
    ],
  },
];

const TOTAL_STEPS = ['Face', 'Eye', 'Hand', ...QUESTIONNAIRE_STEPS.map((s) => s.title), 'Review'];

export default function NewScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<Record<string, string | null>>({ face: null, eye: null, hand: null });
  const [questionnaire, setQuestionnaire] = useState<QuestionnairePayload>({ ...DEFAULT_QUESTIONNAIRE });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const totalSteps = TOTAL_STEPS.length;
  const isImageStep = currentStep < 3;
  const isQuestionStep = currentStep >= 3 && currentStep < 3 + QUESTIONNAIRE_STEPS.length;
  const isReviewStep = currentStep === totalSteps - 1;

  const currentImageStep = isImageStep ? IMAGE_STEPS[currentStep] : null;
  const currentQuestionStep = isQuestionStep ? QUESTIONNAIRE_STEPS[currentStep - 3] : null;

  const handleImageChange = useCallback((key: string, value: string | null) => {
    setImages((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleQuestionChange = useCallback((field: string, value: unknown) => {
    setQuestionnaire((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed = () => {
    if (isImageStep && currentImageStep) return images[currentImageStep.key] !== null;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 4000));
        const scanId = generateId();
        sessionStorage.setItem(`scan-${scanId}`, JSON.stringify({ ...MOCK_SCAN_RESULT, id: scanId, createdAt: new Date().toISOString() }));
        router.push(`/scan/${scanId}/results`);
        return;
      }
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceImage: images.face, eyeImage: images.eye, handImage: images.hand, questionnaire }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Analysis failed. Please try again.');
      }
      const result = await response.json();
      const userId = user?.id || 'anonymous';
      const createdAt = new Date().toISOString();

      // Save to localStorage for history/dashboard
      try {
        const existingScans = JSON.parse(localStorage.getItem('norla_scans') || '[]');
        existingScans.unshift({
          id: result.scanId,
          userId,
          createdAt,
          status: 'completed',
          images: { faceImageUrl: '', eyeImageUrl: '', handImageUrl: '' },
          questionnaire,
          overallBalanceScore: result.overallBalanceScore,
          nutrientScores: result.nutrientScores,
          focusAreas: result.focusAreas,
          recommendations: result.recommendations,
          confidenceNote: result.confidenceNote,
        });
        localStorage.setItem('norla_scans', JSON.stringify(existingScans));
      } catch { /* non-critical */ }

      // Sync scan to server for admin panel
      const userPhone = user?.phone || '';
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scan',
          data: {
            id: result.scanId,
            userId,
            userPhone,
            status: 'completed',
            overallBalanceScore: result.overallBalanceScore,
            nutrientScores: result.nutrientScores,
            focusAreas: result.focusAreas,
            recommendations: result.recommendations,
            confidenceNote: result.confidenceNote,
            createdAt,
          },
        }),
      }).catch(() => {});

      // Store result in sessionStorage for immediate display on results page
      sessionStorage.setItem(`scan-${result.scanId}`, JSON.stringify({
        ...result,
        createdAt,
      }));
      router.push(`/scan/${result.scanId}/results`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <LoadingAnalysisState />;

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <ProgressStepper steps={TOTAL_STEPS} currentStep={currentStep} className="mb-8" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {isImageStep && currentImageStep && (
            <UploadCard
              label={currentImageStep.label}
              description={currentImageStep.description}
              tips={currentImageStep.tips}
              value={images[currentImageStep.key]}
              onChange={(val) => handleImageChange(currentImageStep.key, val)}
            />
          )}

          {isQuestionStep && currentQuestionStep && (
            <div>
              <div className="mb-7">
                <h2
                  className="text-[22px] font-bold text-neutral-900 tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {currentQuestionStep.title}
                </h2>
                <p className="text-[13px] text-neutral-500 mt-1 font-medium">{currentQuestionStep.subtitle}</p>
              </div>
              {currentQuestionStep.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  config={q}
                  value={(questionnaire as unknown as Record<string, unknown>)[q.field]}
                  onChange={handleQuestionChange}
                  index={i}
                />
              ))}
            </div>
          )}

          {isReviewStep && (
            <div>
              <h2
                className="text-[22px] font-bold text-neutral-900 mb-1.5 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Review
              </h2>
              <p className="text-[13px] text-neutral-500 mb-7 font-medium">Confirm everything looks good.</p>

              <div className="grid grid-cols-3 gap-2.5 mb-7">
                {IMAGE_STEPS.map((step) => (
                  <div key={step.key} className="text-center">
                    {images[step.key] ? (
                      <div className="aspect-square rounded-xl overflow-hidden mb-2 shadow-card">
                        <img src={images[step.key]!} alt={step.label} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="aspect-square rounded-xl bg-neutral-100 flex items-center justify-center mb-2"
                        style={{ border: '1px solid rgba(0,0,0,0.04)' }}
                      >
                        <AlertCircle className="h-4 w-4 text-neutral-300" />
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-500 font-semibold">{step.label}</span>
                    {images[step.key] && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[9px] text-brand-600 font-bold">Ready</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl bg-neutral-50 p-5 mb-7"
                style={{ border: '1px solid rgba(0,0,0,0.04)' }}
              >
                <h4
                  className="text-[12px] font-bold text-neutral-600 mb-3 uppercase tracking-[0.1em]"
                >
                  Summary
                </h4>
                <div className="grid grid-cols-2 gap-y-2.5 text-[12px]">
                  {[
                    ['Energy', `${questionnaire.energyLevel}/5`],
                    ['Sleep', `${questionnaire.sleepQuality}/5`],
                    ['Water', `${questionnaire.dailyWaterIntake}/5`],
                    ['Sunlight', `${questionnaire.sunlightExposure}/5`],
                    ['Diet', questionnaire.foodPattern],
                    ['Exercise', `${questionnaire.exerciseLevel}/5`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between pr-4">
                      <span className="text-neutral-400 font-medium">{k}</span>
                      <span className="font-semibold text-neutral-700 capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-[12px] text-error font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>
                  {submitError}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)} disabled={currentStep === 0} className="gap-1.5 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isReviewStep ? (
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
            <Send className="h-4 w-4" /> Analyze
          </Button>
        ) : (
          <Button onClick={() => currentStep < totalSteps - 1 && setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="gap-1.5">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
