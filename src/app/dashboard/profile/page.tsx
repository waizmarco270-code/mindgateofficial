
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { KeyRound, Trash2, Camera, Crown } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    const auth = getAuth();
    let photoURLToUpdate = user.photoURL;

    try {
      // Step 1: If a new avatar is selected, upload it and get the new URL.
      if (newAvatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${newAvatarFile.name}`);
        const uploadResult = await uploadBytes(storageRef, newAvatarFile);
        photoURLToUpdate = await getDownloadURL(uploadResult.ref);
      }
      
      const newDisplayName = displayName.trim();
      const profileUpdates: { displayName: string, photoURL?: string | null } = {
          displayName: newDisplayName,
          photoURL: photoURLToUpdate
      };

      // Step 2: Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, profileUpdates);
      }
      
      // Step 3: Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, profileUpdates);

      toast({ title: "Profile Updated!", description: "Your changes have been saved successfully."});
      
      // Reset the local state for the avatar preview
      setNewAvatarFile(null);
      setNewAvatarPreview(null);

    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Image Too Large',
          description: 'Please select an image smaller than 1MB.',
        });
        return;
      }
      setNewAvatarFile(file);
      setNewAvatarPreview(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "Your User ID has been copied.",
    });
  }
  
  const isSaveDisabled = isSaving || (displayName === user.displayName && !newAvatarFile);

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your photo, display name, and view your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                       <Avatar className="h-24 w-24 border-2 border-primary/20">
                        <AvatarImage src={newAvatarPreview ?? user.photoURL ?? `https://picsum.photos/150/150?u=${user.uid}`} alt={user.displayName ?? 'User'} />
                        <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Change profile picture"
                        >
                           <Camera className="h-8 w-8 text-white" />
                       </button>
                       <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg" className="hidden" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            {displayName || 'Anonymous User'}
                            {isAdmin && (
                                <span className="vip-badge">
                                    <Crown className="h-3 w-3" /> VIP
                                </span>
                            )}
                        </h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                 <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={user.email || ''} disabled />
                    </div>
                </div>
                 <div className="space-y-2 pt-2">
                    <Label htmlFor="uid">Your User ID (UID)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="uid" type="text" value={user.uid} readOnly className="font-mono bg-muted" />
                      <Button type="button" variant="outline" onClick={() => copyToClipboard(user.uid)}>Copy UID</Button>
                    </div>
                </div>
                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaveDisabled}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                 </div>
            </CardContent>
        </Card>

        <div className="space-y-8 lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> Password</CardTitle>
                    <CardDescription>To change your password, please use the "Forgot Password" link on the sign-in page for security.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full">Request Password Reset</Button>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5"/> Delete Account</CardTitle>
                    <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full">Delete My Account</Button>
                </CardContent>
            </Card>
        </div>
      </form>
    </div>
  );
}
