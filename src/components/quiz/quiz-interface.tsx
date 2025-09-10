
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type Quiz } from '@/hooks/use-quizzes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Award, BrainCircuit, Check, Trophy, RefreshCw, X } from 'lucide-react';
import { useUsers } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DialogClose } from '../ui/dialog';

interface QuizInterfaceProps {
    quiz: Quiz;
    onClose: () => void;
}

export function QuizInterface({ quiz, onClose }: QuizInterfaceProps) {
    const { user } = useAuth();
    const { currentUserData, addCreditsToUser, addPerfectedQuiz, incrementQuizAttempt } = useUsers();
    const { toast } = useToast();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);
    const [quizFinished, setQuizFinished] = useState(false);
    const [isInitialAttempt, setIsInitialAttempt] = useState(true);
    
    const creditAwardedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const score = useMemo(() => {
        return quiz.questions.reduce((total, question, index) => {
            return selectedAnswers[index] === question.correctAnswer ? total + 1 : total;
        }, 0);
    }, [selectedAnswers, quiz.questions]);
    
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    
    const startTimer = () => {
        stopTimer(); // Ensure no multiple timers are running
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    stopTimer();
                    finishQuiz();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    };
    
    useEffect(() => {
        startTimer();
        return () => stopTimer();
    }, []);

    const finishQuiz = useCallback(async () => {
        if (quizFinished) return;
        
        stopTimer();
        setQuizFinished(true);

        if(!user) return;
        
        // Always increment attempt count on finish
        await incrementQuizAttempt(user.uid, quiz.id);

        const currentAttempts = (currentUserData?.quizAttempts?.[quiz.id] || 0) + 1;
        const isPerfect = score === quiz.questions.length && score > 0;
        const alreadyPerfected = currentUserData?.perfectedQuizzes?.includes(quiz.id);

        // Award logic: perfect score, within 2 attempts, and not already perfected
        if (isPerfect && currentAttempts <= 2 && !alreadyPerfected && !creditAwardedRef.current) {
            creditAwardedRef.current = true;
            await addCreditsToUser(user.uid, 5);
            await addPerfectedQuiz(user.uid, quiz.id);
            toast({
                title: "Perfect Score! +5 Credits!",
                description: "Congratulations! You've earned a reward for your excellent knowledge.",
                className: "bg-green-500/10 text-green-700 border-green-500/50 dark:text-green-300"
            });
        }
    }, [quizFinished, user, score, quiz, currentUserData, incrementQuizAttempt, addCreditsToUser, addPerfectedQuiz, toast]);


    const handleAnswerSelect = (option: string) => {
        if (quizFinished) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: option
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz();
        }
    };
    
    const handleReattempt = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setTimeLeft(quiz.timeLimit);
        setQuizFinished(false);
        setIsInitialAttempt(false); // It's no longer the first attempt
        creditAwardedRef.current = false; // Reset credit award lock
        startTimer();
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (quizFinished) {
        const isPerfectScore = score === quiz.questions.length && score > 0;
        const alreadyPerfected = currentUserData?.perfectedQuizzes?.includes(quiz.id);
        const currentAttempts = currentUserData?.quizAttempts?.[quiz.id] || 1;
        
        return (
            <div className="flex flex-col items-center justify-center p-4 h-full overflow-y-auto">
                 <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-6">
                            {isPerfectScore ? (
                                <div className="p-6 rounded-full bg-yellow-400/10 self-center border-4 border-yellow-400/50">
                                    <Trophy className="h-16 w-16 text-yellow-400"/>
                                </div>
                            ) : (
                                <div className="p-6 rounded-full bg-primary/10 self-center border-4 border-primary/20">
                                    <Award className="h-16 w-16 text-primary"/>
                                </div>
                            )}
                        </div>
                        <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
                        <CardDescription>You finished with a score of...</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                           <p className="text-6xl font-bold tracking-tight">{score} <span className="text-3xl text-muted-foreground">/ {quiz.questions.length}</span></p>
                        </div>
                        
                        {isPerfectScore && currentAttempts <= 2 && !alreadyPerfected && (
                             <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-green-700 dark:text-green-300">
                                <CheckCircle className="h-5 w-5"/>
                                <p className="font-semibold">Awesome! You earned 5 bonus credits!</p>
                            </div>
                        )}
                         {isPerfectScore && (currentAttempts > 2 || alreadyPerfected) && (
                             <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                                <Trophy className="h-5 w-5"/>
                                <p className="font-semibold">Perfect score! No more credits can be earned for this quiz.</p>
                            </div>
                        )}

                        <div className="space-y-3 pt-4">
                             <h4 className="font-semibold text-left">Review Your Answers:</h4>
                             <div className="max-h-48 overflow-y-auto space-y-2 text-left p-3 border rounded-md bg-muted/50">
                                {quiz.questions.map((q, i) => (
                                     <div key={q.id || i} className="flex justify-between items-center text-sm p-2 rounded-md bg-background">
                                        <p className="flex-1 pr-4">{i + 1}. {q.text}</p>
                                        {selectedAnswers[i] === q.correctAnswer ? 
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0"/> : 
                                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0"/>
                                        }
                                     </div>
                                ))}
                             </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                                <X className="mr-2 h-4 w-4"/> Close
                            </Button>
                        </DialogClose>
                        <Button className="w-full sm:w-auto" onClick={handleReattempt}>
                            <RefreshCw className="mr-2 h-4 w-4"/> Re-attempt Quiz
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="p-4 h-full flex flex-col">
            <Card className="w-full max-w-2xl mx-auto flex flex-col flex-1">
                <CardHeader className="space-y-4">
                     <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <p className="font-medium text-primary">{quiz.title}</p>
                        <div className={cn("flex items-center gap-2 font-mono rounded-full px-3 py-1 text-xs", timeLeft <= 10 && "bg-destructive/10 text-destructive font-bold")}>
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right mt-1">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                    </div>
                    <CardTitle className="pt-4 text-2xl">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="lg"
                                className={cn(
                                    "h-auto py-4 justify-start text-left whitespace-normal leading-tight",
                                    selectedAnswers[currentQuestionIndex] === option ? "ring-2 ring-primary" : "border-muted"
                                )}
                                onClick={() => handleAnswerSelect(option)}
                            >
                                <div className="flex items-center w-full">
                                    <div className="flex-1">{option}</div>
                                    {selectedAnswers[currentQuestionIndex] === option && <Check className="h-5 w-5 ml-4 text-primary"/>}
                                </div>
                            </Button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestionIndex]} className="w-full md:w-auto ml-auto">
                        {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
