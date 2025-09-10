
import { TodoList } from '@/components/todos/todo-list';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

export default function TodosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today's To-Dos</h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM do')}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Daily Checklist</CardTitle>
          <CardDescription>Add your tasks for the day. Complete them all to earn a credit!</CardDescription>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </div>
  );
}
