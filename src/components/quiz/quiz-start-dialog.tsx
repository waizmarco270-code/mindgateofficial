
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { type Quiz } from '@/hooks/use-quizzes';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Award, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle } from 'lucide-react';
import { QuizInterface } from './quiz-interface';


interface QuizStartDialogProps {
  quiz: Quiz;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function QuizStartDialog({ quiz, isOpen, onOpenChange }: QuizStartDialogProps) {
  const { user } = useAuth();
  const { currentUserData } = useUsers();
  const [quizStarted, setQuizStarted] = useState(false);
  
  const alreadyPerfected = currentUserData?.perfectedQuizzes?.includes(quiz.id);

  const handleStartQuiz = () => {
      setQuizStarted(true);
  };

  const handleCloseDialog = (open: boolean) => {
      if(!open) {
          // Reset state when dialog is closed
          setTimeout(() => {
            setQuizStarted(false);
          }, 300);
      }
      onOpenChange(open);
  }

  if (quizStarted) {
      return (
          <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
              <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 data-[state=open]:slide-in-from-bottom-24 transition-all duration-500">
                <QuizInterface quiz={quiz} onClose={() => handleCloseDialog(false)} />
              </DialogContent>
          </Dialog>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Ready to Start?</DialogTitle>
          <DialogDescription>You are about to start the "{quiz.title}" quiz.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-around text-center">
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <p className="font-bold">Entry Fee</p>
              <p className="text-muted-foreground">Free</p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
                <Award className="h-6 w-6" />
              </div>
              <p className="font-bold">Perfect Score Reward</p>
              <p className="text-muted-foreground">+5 Credits</p>
            </div>
          </div>

          {alreadyPerfected ? (
             <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5"/>
                <p className="font-semibold text-sm">You have already earned the reward for this quiz!</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-semibold">The +5 credit reward is only awarded for a perfect score on your first or second attempt.</span> The timer begins immediately after starting.
                </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleStartQuiz}>
            Start Quiz <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
