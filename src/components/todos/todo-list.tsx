
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyTasks {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  creditClaimed: boolean;
}

export function TodoList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addCreditsToUser } = useUsers();
  const todayString = format(new Date(), 'yyyy-MM-dd');
  
  const [todaysData, setTodaysData] = useState<DailyTasks>({ date: todayString, tasks: [], creditClaimed: false });
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);

  // Firestore document reference for today's tasks
  const dailyDocRef = useMemo(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'dailyTasks', todayString);
  }, [user, todayString]);

  // Listen for real-time updates from Firestore
  useEffect(() => {
    if (!dailyDocRef) return;
    setLoading(true);
    const unsubscribe = onSnapshot(dailyDocRef, (doc) => {
      if (doc.exists()) {
        setTodaysData(doc.data() as DailyTasks);
      } else {
        // No data for today yet, use default state
        setTodaysData({ date: todayString, tasks: [], creditClaimed: false });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dailyDocRef, todayString]);


  const updateFirestore = useCallback(async (newData: DailyTasks) => {
    if (dailyDocRef) {
      await setDoc(dailyDocRef, newData, { merge: true });
    }
  }, [dailyDocRef]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '' || !user) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
    };
    const newTasks = [newTask, ...todaysData.tasks];
    await updateFirestore({ ...todaysData, tasks: newTasks });
    setNewTaskText('');
  };

  const toggleTask = async (id: string) => {
    const updatedTasks = todaysData.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await updateFirestore({ ...todaysData, tasks: updatedTasks });
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = todaysData.tasks.filter((task) => task.id !== id);
    await updateFirestore({ ...todaysData, tasks: updatedTasks });
  };

  const handleClaimCredit = async () => {
    if (user && !todaysData.creditClaimed) {
      await addCreditsToUser(user.uid, 1);
      await updateFirestore({ ...todaysData, creditClaimed: true });
      toast({
          title: "Credit Claimed!",
          description: "Great job! You've earned 1 credit for your hard work.",
      });
    }
  };
  
  const allTasksCompleted = useMemo(() => {
      if(todaysData.tasks.length === 0) return false;
      return todaysData.tasks.every(task => task.completed);
  }, [todaysData.tasks]);

  return (
    <div>
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-4">
            <Input
                placeholder="What's your main focus today?"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1"
                disabled={loading}
            />
            <Button type="submit" disabled={loading || !newTaskText.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
        </form>

      <div className="space-y-3">
        {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading today's tasks...</p>
        ) : todaysData.tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tasks for today. Add one to get started!</p>
        ) : (
            todaysData.tasks.map((task) => (
            <div
                key={task.id}
                className="flex items-center gap-4 rounded-lg border p-3 pl-4 transition-all hover:bg-muted/50"
            >
                <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                aria-label={`Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                />
                <label
                htmlFor={`task-${task.id}`}
                className={cn('flex-1 cursor-pointer text-sm', task.completed && 'text-muted-foreground line-through')}
                >
                {task.text}
                </label>
                <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteTask(task.id)}
                aria-label={`Delete task "${task.text}"`}
                >
                <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            ))
        )}
      </div>

      {allTasksCompleted && (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 p-6 text-center">
            <h3 className="text-lg font-semibold text-primary">All Tasks Completed!</h3>
            {todaysData.creditClaimed ? (
                 <p className="text-muted-foreground">You've already claimed your credit for today. See you tomorrow!</p>
            ) : (
                <>
                    <p className="text-muted-foreground">You've crushed your to-do list. Claim your reward!</p>
                    <Button onClick={handleClaimCredit}>
                        <Award className="mr-2 h-4 w-4" /> Claim 1 Credit
                    </Button>
                </>
            )}
        </div>
      )}
    </div>
  );
}
