
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuizzes } from '@/hooks/use-quizzes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Film, Swords, BrainCircuit, BookOpen, Trophy, Award } from 'lucide-react';
import { QuizStartDialog } from '@/components/quiz/quiz-start-dialog';
import { type Quiz } from '@/hooks/use-quizzes';
import { useUsers } from '@/hooks/use-admin';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewQuiz } from '@/hooks/use-new-quiz';

// A helper function to get an icon for a category
const getCategoryIcon = (category: string) => {
    const lowerCaseCategory = category.toLowerCase();
    if (lowerCaseCategory.includes('anime')) return Swords;
    if (lowerCaseCategory.includes('movie') || lowerCaseCategory.includes('series')) return Film;
    if (lowerCaseCategory.includes('study') || lowerCaseCategory.includes('science') || lowerCaseCategory.includes('history')) return BookOpen;
    return BrainCircuit; // Default icon
}

export default function QuizZonePage() {
  const { quizzes, loading: quizzesLoading } = useQuizzes();
  const { users, loading: usersLoading } = useUsers();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { markAsSeen } = useNewQuiz();

  useEffect(() => {
    markAsSeen();
  }, [markAsSeen]);

  const loading = quizzesLoading || usersLoading;

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsDialogOpen(true);
  };
  
  const quizzesByCategory = useMemo(() => {
    return quizzes.reduce((acc, quiz) => {
      const category = quiz.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(quiz);
      return acc;
    }, {} as Record<string, Quiz[]>);
  }, [quizzes]);

  const sortedCategories = useMemo(() => Object.keys(quizzesByCategory).sort(), [quizzesByCategory]);
  
  const topPerformers = useMemo(() => {
      return users
        .map(user => ({
            ...user,
            perfectedCount: user.perfectedQuizzes?.length || 0,
        }))
        .filter(user => user.perfectedCount > 0)
        .sort((a, b) => b.perfectedCount - a.perfectedCount)
        .slice(0, 5); // Get top 5
  }, [users]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quiz Zone</h1>
        <p className="text-muted-foreground">Test your knowledge and earn credits!</p>
      </div>
      
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-amber-500"/> Top Performers</CardTitle>
            <CardDescription>Users who have perfected the most quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading && (
                <div className="space-y-3">
                    <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-1/2" /></div>
                    <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-1/2" /></div>
                    <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-1/2" /></div>
                </div>
            )}
            {!loading && topPerformers.length > 0 ? (
                 <ol className="space-y-3">
                     {topPerformers.map((user, index) => (
                         <li key={user.uid} className="flex items-center gap-4 rounded-md p-2 bg-background/50">
                             <span className="font-bold text-lg text-muted-foreground w-6 text-center">{index + 1}</span>
                             <Avatar className="h-10 w-10 border">
                                <AvatarImage src={user.photoURL ?? undefined} />
                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <p className="font-semibold flex-1">{user.displayName}</p>
                             <div className="flex items-center gap-2 text-amber-600 font-bold">
                                 <Award className="h-5 w-5" />
                                 <span>{user.perfectedCount} Quizzes</span>
                             </div>
                         </li>
                     ))}
                 </ol>
            ) : (
                <p className="text-muted-foreground text-center py-4">Be the first to perfect a quiz and appear here!</p>
            )}
        </CardContent>
      </Card>

      <div className="space-y-8">
        {loading && (
             <div className="space-y-8">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i}>
                        <div className="h-8 w-48 bg-muted rounded-md animate-pulse mb-4" />
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                             {Array.from({ length: 3 }).map((_, j) => (
                                <Card key={j}><CardHeader><CardTitle className="h-6 bg-muted rounded-md animate-pulse"></CardTitle></CardHeader><CardContent><div className="h-10 bg-muted rounded-md animate-pulse"></div></CardContent></Card>
                            ))}
                        </div>
                    </div>
                ))}
             </div>
        )}
        {!loading && sortedCategories.map((category) => {
          const Icon = getCategoryIcon(category);
          return (
             <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight capitalize">{category}</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quizzesByCategory[category].map(quiz => (
                        <Card key={quiz.id}>
                            <CardHeader>
                                <CardTitle>{quiz.title}</CardTitle>
                                <CardDescription>{quiz.questions.length} questions &bull; {quiz.timeLimit / 60} minutes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" onClick={() => handleQuizSelect(quiz)}>
                                    <BrainCircuit className="mr-2 h-4 w-4"/> Start Quiz
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
          )
        })}
        {!loading && sortedCategories.length === 0 && (
            <div className="text-center text-muted-foreground col-span-full py-16">
              <p>No quizzes have been created yet.</p>
              <p>An admin can add new quizzes in the Admin Panel.</p>
            </div>
        )}
      </div>
      
      {selectedQuiz && (
        <QuizStartDialog 
            quiz={selectedQuiz}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
        />
      )}

    </div>
  );
}
