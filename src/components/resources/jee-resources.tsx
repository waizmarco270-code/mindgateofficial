
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Lock, Unlock, Download, KeyRound, CreditCard, AlertTriangle } from 'lucide-react';
import { useResources, useUsers } from '@/hooks/use-admin';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';

const UNLOCK_PASSWORD = "waizextrajee";
const UNLOCK_CREDITS = 30;

export function JeeResources() {
    const { jeeResources, loading } = useResources();
    const { user } = useAuth();
    const { currentUserData, addCreditsToUser } = useUsers();
    const [isPremiumUnlocked, setIsPremiumUnlocked] = useLocalStorage('jeeUnlocked', false);
    const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const currentCredits = currentUserData?.credits ?? 0;

    const handleUnlockWithPassword = () => {
        if (password === UNLOCK_PASSWORD) {
            setIsPremiumUnlocked(true);
            setIsUnlockDialogOpen(false);
            toast({ title: 'Success!', description: 'JEE content unlocked.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrect Password', description: 'Please try again.' });
        }
        setPassword('');
    };

    const handleUnlockWithCredits = () => {
        if (user && currentCredits >= UNLOCK_CREDITS) {
            addCreditsToUser(user.uid, -UNLOCK_CREDITS);
            setIsPremiumUnlocked(true);
            setIsUnlockDialogOpen(false);
            toast({ title: `Unlocked!`, description: `${UNLOCK_CREDITS} credits have been used.` });
        } else {
            toast({ variant: 'destructive', title: 'Insufficient Credits', description: `You need at least ${UNLOCK_CREDITS} credits to unlock.` });
        }
    };

    if (!isPremiumUnlocked) {
        return (
            <>
                <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setIsUnlockDialogOpen(true)}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Lock className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>JEE PREMIUM MATERIAL</CardTitle>
                            <CardDescription>This content is locked. Click to unlock with a password or credits.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Unlock className="h-5 w-5" /> Unlock JEE Premium Content</DialogTitle>
                            <DialogDescription>
                                Gain lifetime access to all JEE premium study materials.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4"/> Unlock with Password</h3>
                                 <div className="space-y-2">
                                    <Label htmlFor="password-jee">Password</Label>
                                    <Input id="password-jee" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter unlock password" />
                                </div>
                                <Button onClick={handleUnlockWithPassword} className="w-full">Unlock</Button>
                            </div>
                           
                            <div className="relative">
                               <Separator />
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                    </span>
                                </div>
                            </div>
                           
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4"/> Unlock with Credits</h3>
                                <p className="text-sm text-muted-foreground">Use <span className="font-bold text-primary">{UNLOCK_CREDITS} credits</span> for permanent access. You currently have <span className="font-bold text-primary">{currentCredits}</span> credits.</p>
                                <Button onClick={handleUnlockWithCredits} disabled={currentCredits < UNLOCK_CREDITS} className="w-full">
                                    Use {UNLOCK_CREDITS} Credits
                                </Button>
                            </div>
                        </div>

                         <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <p className="text-xs">
                                <span className="font-semibold">Use your credits safely.</span> They are a limited resource earned through completing tasks and study sessions.
                            </p>
                        </div>
                        
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <div className="space-y-4">
             <div>
                 <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary"><Unlock /> JEE PREMIUM MATERIAL</h2>
                <p className="text-muted-foreground">Exclusive unlocked content. Aim high!</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {loading && Array.from({length: 3}).map((_, i) => (
                    <Card key={i}>
                         <CardHeader>
                             <CardTitle className="h-6 bg-muted rounded-md animate-pulse"></CardTitle>
                             <CardDescription className="h-4 bg-muted rounded-md animate-pulse mt-2"></CardDescription>
                         </CardHeader>
                         <CardContent>
                             <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                         </CardContent>
                     </Card>
                 ))}
                 {!loading && jeeResources.map(resource => (
                    <Card key={resource.id} className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle>{resource.title}</CardTitle>
                            <CardDescription>{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                 {!loading && jeeResources.length === 0 && (
                    <p className="text-muted-foreground col-span-3 text-center">No JEE resources have been added yet. Check back later!</p>
                )}
            </div>
        </div>
    );
}

    