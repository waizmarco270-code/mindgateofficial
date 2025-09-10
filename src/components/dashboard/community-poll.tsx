
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePolls } from '@/hooks/use-admin';
import { Vote, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function CommunityPoll() {
  const { activePoll, submitPollVote, currentUserData } = usePolls();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userVote = useMemo(() => {
    if (!activePoll || !currentUserData?.votedPolls) return null;
    return currentUserData.votedPolls[activePoll.id];
  }, [activePoll, currentUserData]);
  
  const totalVotes = useMemo(() => {
    if (!activePoll) return 0;
    return Object.values(activePoll.results).reduce((sum, count) => sum + count, 0);
  }, [activePoll]);

  const handleVote = async (option: string) => {
    if (!activePoll || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitPollVote(activePoll.id, option);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activePoll) {
    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5 text-primary" />
                    Community Poll
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">No active poll at the moment. Check back later!</p>
            </CardContent>
        </Card>
    );
  }

  const hasVoted = !!userVote;

  return (
    <Card className="border-sky-500/20 bg-sky-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-600">
           <Vote className="h-5 w-5" />
           Community Poll
        </CardTitle>
        <CardDescription>{activePoll.question}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activePoll.options.map((option, index) => {
            const votesForOption = activePoll.results[option] || 0;
            const percentage = totalVotes > 0 ? (votesForOption / totalVotes) * 100 : 0;
            
            if (hasVoted) {
              const isUserChoice = userVote === option;
              return (
                <div key={index} className="space-y-2 group">
                    <div className="flex justify-between items-center text-sm">
                        <p className={cn("font-semibold", isUserChoice && "text-primary")}>{option}</p>
                        <p className="text-muted-foreground font-medium">{percentage.toFixed(0)}%</p>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500", isUserChoice ? "bg-primary" : "bg-muted-foreground/30")} 
                          style={{ width: `${percentage}%`}}
                        />
                    </div>
                </div>
              );
            }
            
            return (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-12 text-base"
                onClick={() => handleVote(option)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Voting...' : option}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
