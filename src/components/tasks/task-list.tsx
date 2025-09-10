
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const initialTasks: Task[] = [
  { id: 1, text: 'Read Chapter 3 of History book', completed: false },
  { id: 2, text: 'Complete Math assignment on Algebra', completed: true },
  { id: 3, text: 'Prepare for Physics quiz', completed: false },
];

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
        } else {
            setTasks(initialTasks);
        }
    } catch (error) {
        console.error("Failed to parse tasks from localStorage", error);
        setTasks(initialTasks);
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);


  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText,
      completed: false,
    };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setIsDialogOpen(false);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };
  
  return (
    <div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="mb-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add a new task</DialogTitle>
                    <DialogDescription>
                        Enter the details of your new task below. Click "Add Task" when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-name" className="text-right">
                            Task
                        </Label>
                        <Input 
                            id="task-name" 
                            value={newTaskText} 
                            onChange={(e) => setNewTaskText(e.target.value)} 
                            className="col-span-3"
                            placeholder="e.g. Finish chemistry homework"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddTask}>Add Task</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="space-y-3">
        {tasks.map((task) => (
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Edit className="h-4 w-4" />
            </Button>
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
        ))}
      </div>
    </div>
  );
}
