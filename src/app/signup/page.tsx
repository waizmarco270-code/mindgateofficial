
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseApp, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { Progress } from '@/components/ui/progress';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please enter your first and last name.',
        });
        return;
    }
    setLoading(true);
    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const fullName = `${firstName} ${lastName}`.trim();
      
      // 2. Update their profile in Authentication (e.g., for display name)
      await updateProfile(newUser, { displayName: fullName });

      // 3. **CRITICAL STEP**: Create the user document in Firestore database
      // This is what was failing before.
      const userDocRef = doc(db, "users", newUser.uid);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        displayName: fullName,
        email: email,
        isBlocked: false,
        credits: 50, // Assign 50 credits on signup
        socialUnlocked: false, // Default social feature to locked
      });

      toast({
        title: 'Account Created!',
        description: "You've been successfully signed up. Redirecting...",
      });
      // The useEffect will handle redirection to the dashboard.
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-8 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-primary/10 z-0"></div>
         <div className="absolute h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse -top-10 -left-10"></div>
         <div className="absolute h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse -bottom-10 -right-10"></div>
        <div className="z-10 flex flex-col items-center gap-6">
          <Logo className="h-28 w-28" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-medium text-foreground">Preparing your account</p>
            <p className="text-sm text-muted-foreground">This will only take a moment...</p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
       <div className="relative flex items-center justify-center py-12 lg:py-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-background to-primary/40 z-10"></div>
        <div className="relative z-20 mx-auto grid w-[380px] gap-6 p-10 rounded-2xl bg-card/80 backdrop-blur-lg border border-primary/20 shadow-2xl shadow-primary/10">
          <form onSubmit={handleSignup}>
            <div className="grid gap-2 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                  <Logo className="h-12 w-12" />
                  <h1 className="text-4xl font-bold tracking-tight">Create Account</h1>
              </div>
              <p className="text-balance text-muted-foreground">Join us and start your AI-powered learning journey.</p>
            </div>
            <div className="grid gap-4 mt-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" placeholder="Max" required value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
              </div>
              <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                 {loading ? <div className="h-6 w-6 animate-spin rounded-full border-4 border-dashed border-primary-foreground"></div> : <><UserPlus className="mr-2 h-5 w-5" /> Create Account</>}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="underline text-primary font-medium" prefetch={false}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
       <div className="hidden bg-muted lg:block relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background z-10"></div>
        <Image
            src="https://picsum.photos/1200/1000"
            alt="Abstract background"
            width={1200}
            height={1000}
            className="h-full w-full object-cover dark:brightness-[0.3]"
            data-ai-hint="abstract digital"
        />
         <div className="absolute inset-0 flex items-end p-20 z-20">
            <div className="text-white bg-black/30 p-8 rounded-xl backdrop-blur-sm">
                <h2 className="text-5xl font-bold leading-tight">The Future of Learning.</h2>
                <p className="text-xl mt-4 text-white/80 max-w-lg">Join thousands of students revolutionizing their study habits with MindMate.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
