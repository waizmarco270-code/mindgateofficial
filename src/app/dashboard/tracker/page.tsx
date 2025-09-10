
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BrainCircuit, CheckCircle, Music, XCircle, AlarmClock, Award } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const FOCUS_SLOTS = [
  { duration: 3600, reward: 2, label: '1 Hour' },
  { duration: 7200, reward: 5, label: '2 Hours' },
  { duration: 10800, reward: 10, label: '3 Hours' },
];

const PENALTY = -10;

export default function FocusModePage() {
  const { user } = useAuth();
  const { addCreditsToUser } = useUsers();
  const { toast } = useToast();

  const [session, setSession] = useState<{ duration: number; reward: number; timeLeft: number; } | null>(null);
  const [isActive, setIsActive] = useState(false);
  const sessionRef = useRef(session);
  const isActiveRef = useRef(isActive);

  // Keep refs in sync with state to use in cleanup functions
  useEffect(() => {
    sessionRef.current = session;
    isActiveRef.current = isActive;
  }, [session, isActive]);

  const stopSession = useCallback((isPenalty = false) => {
    setIsActive(false);
    if (isPenalty && user) {
      addCreditsToUser(user.uid, PENALTY);
      toast({
        variant: 'destructive',
        title: 'Session Incomplete',
        description: `You lost ${-PENALTY} credits for not completing the session.`,
      });
    }
    setSession(null);
  }, [user, addCreditsToUser, toast]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && session) {
      interval = setInterval(() => {
        setSession(prev => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            // Session Complete
            if (user) {
              addCreditsToUser(user.uid, prev.reward);
              toast({
                title: 'Focus Session Complete!',
                description: `Congratulations! You have earned ${prev.reward} credits.`,
                className: "bg-green-500/10 text-green-700 border-green-500/50 dark:text-green-300"
              });
            }
            setIsActive(false);
            clearInterval(interval!);
            return null;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, session, user, addCreditsToUser, toast]);
  
  // Handle component unmount (leaving page) and browser tab closing
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if(isActiveRef.current && sessionRef.current) {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave? Your focus session is active and you will be penalized.';
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // This is the cleanup function that runs when the component unmounts
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // If the session was active when the user navigated away, apply the penalty
        if (isActiveRef.current && sessionRef.current && user) {
             addCreditsToUser(user.uid, PENALTY);
             toast({
                variant: 'destructive',
                title: 'Session Abandoned',
                description: `You lost ${-PENALTY} credits for leaving the focus session early.`,
            });
        }
      };
  }, [user, addCreditsToUser, toast]); // Dependencies for the cleanup function

  const startSession = (duration: number, reward: number) => {
    setSession({ duration, reward, timeLeft: duration });
    setIsActive(true);
  };
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const progress = session ? ((session.duration - session.timeLeft) / session.duration) * 100 : 0;

  if (isActive && session) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full py-10">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-4xl font-bold tracking-tighter">Focus Mode Active</CardTitle>
                <CardDescription>Stay on this page to complete your session.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="relative h-64 w-64">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle className="text-muted" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"/>
                        <circle
                            className="text-primary"
                            strokeWidth="7"
                            strokeDasharray="283"
                            strokeDashoffset={283 * (1 - progress / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold font-mono tabular-nums tracking-tighter">
                            {formatTime(session.timeLeft)}
                        </span>
                        <p className="text-sm text-muted-foreground">Time Remaining</p>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="lg">
                            <XCircle className="mr-2" /> Stop Session & Incur Penalty
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you sure you want to stop?</AlertDialogTitle>
                            <AlertDialogDescription>
                                If you end the session now, you will not receive your credit reward and will be penalized <span className="font-bold text-destructive">{-PENALTY} credits.</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Focusing</AlertDialogCancel>
                            <AlertDialogAction onClick={() => stopSession(true)}>
                                Yes, Stop Session
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BrainCircuit className="h-8 w-8 text-primary"/> Focus Mode</h1>
        <p className="text-muted-foreground">Choose a focus slot to start a distraction-free study session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Focus Slot</CardTitle>
          <CardDescription>Complete a session to earn credits. Leaving early will result in a penalty.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {FOCUS_SLOTS.map(slot => (
            <button key={slot.duration} onClick={() => startSession(slot.duration, slot.reward)}
              className="p-6 border rounded-lg text-center hover:bg-muted hover:border-primary transition-all group"
            >
              <div className="flex flex-col items-center gap-2">
                <AlarmClock className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-2xl font-bold">{slot.label}</p>
                 <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-300">
                   <Award className="h-4 w-4"/> +{slot.reward} Credits
                 </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

       <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="flex-row items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive"/>
            <div>
                <CardTitle className="text-destructive">Important: The Penalty Rule</CardTitle>
                <CardDescription className="text-destructive/80">
                    If you start a session and decide to stop it before the timer is complete, or if you leave this page, you will be penalized <span className="font-bold">{-PENALTY} credits</span>. This is to encourage disciplined study habits.
                </CardDescription>
            </div>
        </CardHeader>
      </Card>
    </div>
  );
}

    