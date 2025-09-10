
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdmin, type Resource } from '@/hooks/use-admin';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Send, Trash2, MinusCircle, Vote, AlertTriangle, Edit, Lock, Unlock, Gift, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, writeBatch, getDocs, query, doc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuizzes } from '@/hooks/use-quizzes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface QuizQuestion {
    text: string;
    options: string[];
    correctAnswer: string;
}

const CREDIT_UNLOCK_PASSWORD = "waizcredit";

export default function AdminPanelPage() {
  const { 
    isAdmin, users, toggleUserBlock, giftCreditsToUser, resetUserCredits,
    addAnnouncement, 
    resources, addResource, updateResource, deleteResource,
    premiumResources, addPremiumResource, updatePremiumResource, deletePremiumResource,
    jeeResources, addJeeResource, updateJeeResource, deleteJeeResource,
    class12Resources, addClass12Resource, updateClass12Resource, deleteClass12Resource
  } = useAdmin();
  const { quizzes, deleteQuiz } = useQuizzes();
  const { toast } = useToast();
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(300);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isPublishingPoll, setIsPublishingPoll] = useState(false);

  // State for editing resources
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // State for credit control
  const [isCreditControlUnlocked, setIsCreditControlUnlocked] = useState(false);
  const [creditPassword, setCreditPassword] = useState('');
  const [selectedCreditUser, setSelectedCreditUser] = useState('');
  const [giftAmount, setGiftAmount] = useState(10);


  const handleSubmitAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    if (title && description) {
        await addAnnouncement({ title, description });
        (e.target as HTMLFormElement).reset();
        toast({ title: "Success", description: "Announcement has been published." });
    }
  };

  // Generic handler for submitting resource forms (add or edit)
  const handleResourceFormSubmit = async (e: React.FormEvent<HTMLFormElement>, type: 'general' | 'premium' | 'jee' | 'class12') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') as string;

    if (!title || !description || !url) {
        toast({ variant: 'destructive', title: "Validation Error", description: "All fields are required." });
        return;
    }

    const resourceData = { title, description, url };
    
    try {
        if (editingResource) {
            // Update logic
            const updateFunction = {
                'general': updateResource,
                'premium': updatePremiumResource,
                'jee': updateJeeResource,
                'class12': updateClass12Resource
            }[type];
            await updateFunction(editingResource.id, resourceData);
            toast({ title: "Resource Updated", description: "The resource has been successfully updated." });
        } else {
            // Add logic
            const addFunction = {
                'general': addResource,
                'premium': addPremiumResource,
                'jee': addJeeResource,
                'class12': addClass12Resource
            }[type];
            await addFunction(resourceData);
            toast({ title: "Resource Added", description: "The new resource has been added." });
        }
        (e.target as HTMLFormElement).reset();
        closeEditDialog();
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Operation Failed", description: error.message });
    }
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingResource(null);
    setIsEditDialogOpen(false);
  };
  
  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: string | string[]) => {
      const newQuestions = [...quizQuestions];
      if (field === 'options' && Array.isArray(value)) {
          newQuestions[index].options = value;
      } else if(typeof value === 'string') {
          (newQuestions[index] as any)[field] = value;
      }
      setQuizQuestions(newQuestions);
  }

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
      const newQuestions = [...quizQuestions];
      newQuestions[qIndex].options[oIndex] = value;
      setQuizQuestions(newQuestions);
  }

  const addQuestion = () => {
      setQuizQuestions([...quizQuestions, { text: '', options: ['', '', '', ''], correctAnswer: '' }]);
  }
  
  const removeQuestion = (index: number) => {
      const newQuestions = quizQuestions.filter((_, i) => i !== index);
      setQuizQuestions(newQuestions);
  }

  const handleSaveQuiz = async () => {
      if (!quizTitle || !quizCategory || quizQuestions.some(q => !q.text || q.options.some(o => !o) || !q.correctAnswer)) {
          toast({ variant: 'destructive', title: "Validation Error", description: "Please fill all quiz fields, including all questions, options, and correct answers." });
          return;
      }
      setIsSavingQuiz(true);
      try {
          await addDoc(collection(db, 'quizzes'), {
              title: quizTitle,
              category: quizCategory.trim(),
              timeLimit: quizTimeLimit,
              questions: quizQuestions,
              createdAt: new Date().toISOString(),
          });
          toast({ title: "Quiz Saved!", description: "The new quiz has been added to the database." });
          setQuizTitle('');
          setQuizCategory('');
          setQuizTimeLimit(300);
          setQuizQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: '' }]);
      } catch (error: any) {
          toast({ variant: 'destructive', title: "Error Saving Quiz", description: error.message });
      } finally {
          setIsSavingQuiz(false);
      }
  }

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index: number) => {
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  const handlePublishPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) {
      toast({ variant: 'destructive', title: "Validation Error", description: "Please fill in the poll question and all options." });
      return;
    }
    setIsPublishingPoll(true);
    try {
      const pollsRef = collection(db, 'polls');
      const batch = writeBatch(db);
      const q = query(collection(db, 'polls'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      const results = pollOptions.reduce((acc, option) => {
        acc[option] = 0;
        return acc;
      }, {} as Record<string, number>);
      const newPollRef = doc(pollsRef);
      batch.set(newPollRef, {
        question: pollQuestion,
        options: pollOptions,
        results: results,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await batch.commit();
      toast({ title: "Poll Published!", description: "The new poll is now live for all users." });
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error Publishing Poll", description: error.message });
    } finally {
      setIsPublishingPoll(false);
    }
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
      try {
          await deleteQuiz(quizId);
          toast({ title: "Quiz Deleted", description: "The quiz has been removed from the database." });
      } catch (error: any) {
          toast({ variant: 'destructive', title: "Error Deleting Quiz", description: error.message });
      }
  }
  
  const handleCreditUnlock = () => {
    if(creditPassword === CREDIT_UNLOCK_PASSWORD) {
        setIsCreditControlUnlocked(true);
        toast({ title: "Access Granted", description: "Credit control panel unlocked."});
    } else {
        toast({ variant: 'destructive', title: "Access Denied", description: "The password you entered is incorrect."});
    }
    setCreditPassword('');
  }

  const handleGiftCredits = async () => {
    if(!selectedCreditUser) {
        toast({ variant: 'destructive', title: "No User Selected", description: "Please select a user to gift credits to."});
        return;
    }
    await giftCreditsToUser(selectedCreditUser, giftAmount);
    toast({ title: "Credits Gifted!", description: `Successfully sent ${giftAmount} credits.`});
  }
  
  const handleResetCredits = async () => {
    if(!selectedCreditUser) {
        toast({ variant: 'destructive', title: "No User Selected", description: "Please select a user to reset credits for."});
        return;
    }
    await resetUserCredits(selectedCreditUser);
    toast({ title: "Credits Reset!", description: `User's credits have been reset to 50.`});
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const renderResourceTable = (title: string, description: string, data: Resource[], deleteFn: (id: string) => Promise<void>) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((resource) => (
                        <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.title}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(resource)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the resource. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteFn(resource.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && <TableRow><TableCell colSpan={2} className="h-24 text-center">No resources found.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, content, and application settings.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Publish Announcement</CardTitle><CardDescription>Create a new announcement for all users.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="announcement-title">Title</Label><Input id="announcement-title" name="title" placeholder="e.g. New Feature Release" required /></div>
              <div className="space-y-2"><Label htmlFor="announcement-description">Description</Label><Textarea id="announcement-description" name="description" placeholder="Describe the announcement..." required /></div>
              <Button type="submit"><Send className="mr-2 h-4 w-4" /> Publish</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Publish Community Poll</CardTitle><CardDescription>Create a new poll for the dashboard.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="poll-question">Poll Question</Label><Input id="poll-question" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="e.g. What feature should we build next?" /></div>
            <div className="space-y-2"><Label>Options</Label>
              {pollOptions.map((option, index) => (<div key={index} className="flex items-center gap-2"><Input value={option} onChange={e => handlePollOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} />{pollOptions.length > 2 && (<Button variant="ghost" size="icon" onClick={() => removePollOption(index)}><MinusCircle className="h-4 w-4 text-destructive" /></Button>)}</div>))}
            </div>
            <div className="flex justify-between"><Button variant="outline" onClick={addPollOption}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button><Button onClick={handlePublishPoll} disabled={isPublishingPoll}><Vote className="mr-2 h-4 w-4" /> {isPublishingPoll ? 'Publishing...' : 'Publish Poll'}</Button></div>
          </CardContent>
        </Card>
      </div>
      
       <Card>
        <CardHeader><CardTitle>User Management</CardTitle><CardDescription>View and manage all registered users.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Credits</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{users.map(user => (<TableRow key={user.id}><TableCell className="font-medium">{user.displayName}</TableCell><TableCell>{user.email}</TableCell><TableCell><Badge variant={user.isBlocked ? 'destructive' : 'secondary'}>{user.isBlocked ? 'Blocked' : 'Active'}</Badge></TableCell><TableCell className="font-medium">{user.credits}</TableCell><TableCell className="text-right"><Button variant={user.isBlocked ? 'outline' : 'destructive'} size="sm" onClick={() => toggleUserBlock(user.uid, user.isBlocked)}>{user.isBlocked ? 'Unblock' : 'Block'} User</Button></TableCell></TableRow>))}</TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Credit Control</CardTitle>
          <CardDescription>Gift or reset credits for a user. This is a restricted action.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreditControlUnlocked ? (
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <Input 
                type="password"
                placeholder="Enter access password"
                value={creditPassword}
                onChange={e => setCreditPassword(e.target.value)}
              />
              <Button onClick={handleCreditUnlock}><Unlock className="mr-2 h-4 w-4" /> Unlock</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
                {/* Gift Credits */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Gift className="h-5 w-5 text-green-500"/> Gift Credits</h3>
                    <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select onValueChange={setSelectedCreditUser}>
                            <SelectTrigger><SelectValue placeholder="Select a user..." /></SelectTrigger>
                            <SelectContent>{users.map(u => <SelectItem key={u.uid} value={u.uid}>{u.displayName} ({u.email})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} />
                    </div>
                    <Button onClick={handleGiftCredits} className="bg-green-600 hover:bg-green-700">Gift Credits</Button>
                </div>
                {/* Reset Credits */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-destructive"/> Reset Credits</h3>
                    <p className="text-sm text-muted-foreground">This will reset the selected user's credit balance to the default 50.</p>
                     <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select onValueChange={setSelectedCreditUser}>
                            <SelectTrigger><SelectValue placeholder="Select a user..." /></SelectTrigger>
                            <SelectContent>{users.map(u => <SelectItem key={u.uid} value={u.uid}>{u.displayName} ({u.email})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Reset Credits to 50</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently set the selected user's credits to 50. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetCredits}>Yes, Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add General Resource</CardTitle></CardHeader>
          <CardContent><form onSubmit={(e) => handleResourceFormSubmit(e, 'general')} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="resource-title">Title</Label><Input id="resource-title" name="title" placeholder="e.g. Physics Formula Sheet" required /></div>
              <div className="space-y-2"><Label htmlFor="resource-description">Description</Label><Textarea id="resource-description" name="description" placeholder="A short description of the resource." required /></div>
              <div className="space-y-2"><Label htmlFor="resource-url">URL</Label><Input id="resource-url" name="url" type="url" placeholder="https://example.com/file.pdf" required /></div>
              <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Resource</Button>
            </form></CardContent>
        </Card>
        {renderResourceTable("General Resources", "Manage free resources available to all students.", resources, deleteResource)}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
         <Card>
            <CardHeader><CardTitle>Add Premium Resource (Class 10)</CardTitle></CardHeader>
            <CardContent><form onSubmit={(e) => handleResourceFormSubmit(e, 'premium')} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="premium-resource-title-10">Title</Label><Input id="premium-resource-title-10" name="title" placeholder="e.g. Advanced Mathematics PDF" required /></div>
                <div className="space-y-2"><Label htmlFor="premium-resource-description-10">Description</Label><Textarea id="premium-resource-description-10" name="description" placeholder="A short description of the premium PDF." required /></div>
                <div className="space-y-2"><Label htmlFor="premium-resource-url-10">PDF URL</Label><Input id="premium-resource-url-10" name="url" type="url" placeholder="https://example.com/premium.pdf" required /></div>
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Premium Resource</Button>
              </form></CardContent>
          </Card>
          {renderResourceTable("Class 10 Resources", "Manage locked 'Class 10' resources.", premiumResources, deletePremiumResource)}
       </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Add JEE Premium Resource</CardTitle></CardHeader>
            <CardContent><form onSubmit={(e) => handleResourceFormSubmit(e, 'jee')} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="jee-resource-title">Title</Label><Input id="jee-resource-title" name="title" placeholder="e.g. JEE Advanced Physics" required /></div>
                <div className="space-y-2"><Label htmlFor="jee-resource-description">Description</Label><Textarea id="jee-resource-description" name="description" placeholder="A short description of the resource." required /></div>
                <div className="space-y-2"><Label htmlFor="jee-resource-url">URL</Label><Input id="jee-resource-url" name="url" type="url" placeholder="https://example.com/file.pdf" required /></div>
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add JEE Resource</Button>
              </form></CardContent>
          </Card>
          {renderResourceTable("JEE Resources", "Manage locked 'JEE' resources.", jeeResources, deleteJeeResource)}
       </div>

       <div className="grid gap-8 lg:grid-cols-2">
           <Card>
            <CardHeader><CardTitle>Add Class 12 Premium Resource</CardTitle></CardHeader>
            <CardContent><form onSubmit={(e) => handleResourceFormSubmit(e, 'class12')} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="class12-resource-title">Title</Label><Input id="class12-resource-title" name="title" placeholder="e.g. Class 12 Chemistry Notes" required /></div>
                <div className="space-y-2"><Label htmlFor="class12-resource-description">Description</Label><Textarea id="class12-resource-description" name="description" placeholder="A short description of the premium PDF." required /></div>
                <div className="space-y-2"><Label htmlFor="class12-resource-url">PDF URL</Label><Input id="class12-resource-url" name="url" type="url" placeholder="https://example.com/premium.pdf" required /></div>
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Class 12 Resource</Button>
              </form></CardContent>
          </Card>
          {renderResourceTable("Class 12 Resources", "Manage locked 'Class 12' resources.", class12Resources, deleteClass12Resource)}
       </div>
        
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Create New Quiz</CardTitle><CardDescription>Build and publish a new quiz for the Quiz Zone.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2"><Label htmlFor="quiz-title">Quiz Title</Label><Input id="quiz-title" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g. The Ultimate Anime Quiz" /></div>
                    <div className="space-y-2"><Label htmlFor="quiz-category">Category</Label><Input id="quiz-category" value={quizCategory} onChange={e => setQuizCategory(e.target.value)} placeholder="e.g. Anime or Study Quiz" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="quiz-time-limit">Time Limit (seconds)</Label><Input id="quiz-time-limit" type="number" value={quizTimeLimit} onChange={e => setQuizTimeLimit(Number(e.target.value))} placeholder="e.g. 300" /></div>
                <div className="space-y-4">{quizQuestions.map((q, qIndex) => (<div key={qIndex} className="p-4 border rounded-lg space-y-4 relative">{quizQuestions.length > 1 && (<Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4" /></Button>)}<div className="space-y-2"><Label htmlFor={`q-text-${qIndex}`}>Question {qIndex + 1}</Label><Input id={`q-text-${qIndex}`} value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} placeholder="e.g. Who is the main protagonist of 'Attack on Titan'?" /></div><div className="grid grid-cols-2 gap-4">{q.options.map((opt, oIndex) => (<div className="space-y-2" key={oIndex}><Label htmlFor={`q-${qIndex}-opt-${oIndex}`}>Option {oIndex + 1}</Label><Input id={`q-${qIndex}-opt-${oIndex}`} value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} /></div>))}</div><div className="space-y-2"><Label htmlFor={`q-correct-${qIndex}`}>Correct Answer</Label><Select value={q.correctAnswer} onValueChange={val => handleQuestionChange(qIndex, 'correctAnswer', val)}><SelectTrigger id={`q-correct-${qIndex}`}><SelectValue placeholder="Select correct answer..." /></SelectTrigger><SelectContent>{q.options.filter(o => o.trim() !== '').map((opt, oIndex) => (<SelectItem key={oIndex} value={opt}>{opt}</SelectItem>))}</SelectContent></Select></div></div>))}</div>
                <div className="flex justify-between items-center"><Button variant="outline" onClick={addQuestion}>Add Another Question</Button><Button onClick={handleSaveQuiz} disabled={isSavingQuiz}>{isSavingQuiz ? 'Saving...' : 'Save Quiz'}</Button></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Quiz Management</CardTitle><CardDescription>Review and delete existing quizzes.</CardDescription></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Questions</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>{quizzes.map((quiz) => (<TableRow key={quiz.id}><TableCell className="font-medium">{quiz.title}</TableCell><TableCell>{quiz.category}</TableCell><TableCell>{quiz.questions.length}</TableCell><TableCell className="text-right"><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the<span className="font-semibold text-foreground"> {quiz.title} </span> quiz and remove it from the database.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id)}>Yes, delete quiz</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>))}
                        {quizzes.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No quizzes created yet.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Resource</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                    const resourceType = 
                        resources.some(r => r.id === editingResource?.id) ? 'general' :
                        premiumResources.some(r => r.id === editingResource?.id) ? 'premium' :
                        jeeResources.some(r => r.id === editingResource?.id) ? 'jee' :
                        'class12';
                    handleResourceFormSubmit(e, resourceType);
                }} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" name="title" defaultValue={editingResource?.title} required /></div>
                    <div className="space-y-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" name="description" defaultValue={editingResource?.description} required /></div>
                    <div className="space-y-2"><Label htmlFor="edit-url">URL</Label><Input id="edit-url" name="url" type="url" defaultValue={editingResource?.url} required /></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Changes</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    