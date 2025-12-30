
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Check,
  User,
  Vault,
  ShieldCheck,
  Film,
  Brain,
  Award,
  History,
  LogIn,
  MapPin,
  Edit,
  Save,
  Phone,
  UserCircle,
  AtSign,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateUserProfile, isUsernameAvailable } from '@/firebase/firestore/user-profile';
import { format } from 'date-fns';


const badges = [
    { name: 'Cricket Novice', icon: ShieldCheck, earned: true },
    { name: 'Movie Buff', icon: Film, earned: true },
    { name: 'Trivia Titan', icon: Brain, earned: true },
    { name: 'Quiz Master', icon: Award, earned: false },
    { name: 'Fact Checker', icon: Check, earned: false },
    { name: 'Daily Streaker', icon: History, earned: false },
];

const historyItems = [
    { type: 'Quiz', title: 'Daily News Quiz - June 12', score: '85%' },
    { type: 'Game', title: 'Soundstrike Challenge', score: '3/3 Correct' },
    { type: 'Quiz', title: 'Movie Quiz: RRR', score: '4/5 Correct' },
    { type: 'Game', title: 'Fact or Fiction: IPL Dynasties', score: '5/5 Correct' },
];

function ProfileHeader({ user, isLoading, userProfile }: { user: any, isLoading: boolean, userProfile?: UserProfile | null}) {
    const router = useRouter();
    const firestore = useFirestore();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(userProfile?.username || '');
    const [realName, setRealName] = useState(userProfile?.realName || '');
    const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
    const [city, setCity] = useState(userProfile?.city || '');
    const [state, setState] = useState(userProfile?.state || '');
    const [isSaving, setIsSaving] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    // Check username availability as user types
    const handleUsernameChange = async (value: string) => {
      setUsername(value);
      setUsernameError('');
      
      if (!firestore || !value || value.length < 3) {
        if (value && value.length < 3) {
          setUsernameError('Username must be at least 3 characters');
        }
        return;
      }

      // Validate format
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
        return;
      }

      setCheckingUsername(true);
      try {
        const available = await isUsernameAvailable(firestore, value, user?.uid);
        if (!available) {
          setUsernameError('Username is already taken');
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setCheckingUsername(false);
      }
    };

    const handleSave = async () => {
      if (!firestore || !user) return;
      
      // Validate username if provided
      if (username && username.length < 3) {
        toast({
          variant: 'destructive',
          title: 'Invalid Username',
          description: 'Username must be at least 3 characters long.',
        });
        return;
      }

      if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
        toast({
          variant: 'destructive',
          title: 'Invalid Username',
          description: 'Username can only contain letters, numbers, underscores, and hyphens.',
        });
        return;
      }

      if (usernameError) {
        toast({
          variant: 'destructive',
          title: 'Username Error',
          description: usernameError,
        });
        return;
      }
      
      setIsSaving(true);
      try {
        await updateUserProfile(firestore, user.uid, {
          username: username.trim() || undefined,
          realName: realName.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        });
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been saved.',
        });
        setIsEditing(false);
        setUsernameError('');
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'There was an error updating your profile. Please try again.',
        });
      } finally {
        setIsSaving(false);
      }
    };

    if (isLoading) {
        return (
             <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className='space-y-2'>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
        )
    }
    
    if (!user) {
        return (
             <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                    <AvatarFallback>
                        <User className="w-12 h-12" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold md:text-4xl font-headline">
                        Welcome, Guest
                    </h1>
                    <p className="mt-1 text-muted-foreground">Log in to view your profile and save your progress.</p>
                     <Button className="mt-4" asChild>
                        <Link href="/login">
                           <LogIn className='mr-2'/>
                           Login or Sign Up
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold md:text-4xl font-headline">
                {userProfile?.username || user?.displayName || 'User'}
              </h1>
              <p className="mt-1 text-muted-foreground">{user?.email || 'user@example.com'}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {userProfile && (userProfile.city || userProfile.state) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {userProfile.city && userProfile.state 
                      ? `${userProfile.city}, ${userProfile.state}`
                      : userProfile.city || userProfile.state}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Edit Form */}
          {userProfile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true);
                        setUsername(userProfile?.username || '');
                        setRealName(userProfile?.realName || '');
                        setPhoneNumber(userProfile?.phoneNumber || '');
                        setCity(userProfile?.city || '');
                        setState(userProfile?.state || '');
                        setUsernameError('');
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {isEditing 
                    ? 'Update your profile information. Username will be displayed publicly.'
                    : 'Your profile information. Username is displayed publicly, other details are private.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center gap-2">
                        <AtSign className="w-4 h-4" />
                        Username (Public)
                      </Label>
                      <Input
                        id="username"
                        placeholder="Choose a unique username"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={usernameError ? 'border-destructive' : ''}
                      />
                      {checkingUsername && (
                        <p className="text-xs text-muted-foreground">Checking availability...</p>
                      )}
                      {usernameError && (
                        <p className="text-xs text-destructive">{usernameError}</p>
                      )}
                      {!usernameError && username && username.length >= 3 && (
                        <p className="text-xs text-green-500">✓ Username available</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        This will be displayed in leaderboards and greetings. 3-20 characters, letters, numbers, underscores, and hyphens only.
                      </p>
                    </div>

                    {/* Real Name */}
                    <div className="space-y-2">
                      <Label htmlFor="realName" className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        Real Name (Private)
                      </Label>
                      <Input
                        id="realName"
                        placeholder="Your full name"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your real name (kept private, not displayed publicly)
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number (Private)
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+91 1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your phone number (kept private, not displayed publicly)
                      </p>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || !!usernameError || !!(username && username.length < 3)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setUsername(userProfile?.username || '');
                          setRealName(userProfile?.realName || '');
                          setPhoneNumber(userProfile?.phoneNumber || '');
                          setCity(userProfile?.city || '');
                          setState(userProfile?.state || '');
                          setUsernameError('');
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Username</Label>
                        <p className="font-semibold">{userProfile.username || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Real Name</Label>
                        <p className="font-semibold">{userProfile.realName || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone Number</Label>
                        <p className="font-semibold">{userProfile.phoneNumber || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-semibold">{user?.email || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
    )
}

export default function ProfilePage() {
    const { user, isLoading } = useUser();
    const firestore = useFirestore();
    const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
    const { data: userProfile } = useDoc(userProfileRef);

  return (
    <div className="space-y-8">
      <ProfileHeader user={user} isLoading={isLoading} userProfile={(userProfile as any) as UserProfile | null | undefined} />

      <Tabs defaultValue="badges">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges" disabled={!user || isLoading}>Insight Badges</TabsTrigger>
          <TabsTrigger value="history" disabled={!user || isLoading}>History</TabsTrigger>
          <TabsTrigger value="vault" disabled={!user || isLoading}>Knowledge Vault</TabsTrigger>
        </TabsList>
        <TabsContent value="badges" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Your Insight Badges</CardTitle>
              <CardDescription>
                Milestones from your journey of knowledge.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {badges.map(badge => (
                        <Card key={badge.name} className={`p-4 text-center space-y-2 ${badge.earned ? 'opacity-100 border-primary/50' : 'opacity-40'}`}>
                           <badge.icon className={`w-12 h-12 mx-auto ${badge.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                           <p className="font-semibold text-sm">{badge.name}</p>
                        </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                A log of your recently completed challenges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-4'>
                {historyItems.map((item, index) => (
                    <li key={index} className='flex justify-between items-center p-3 rounded-lg bg-white/5'>
                        <div>
                            <span className='text-xs text-primary'>{item.type}</span>
                            <p className='font-semibold'>{item.title}</p>
                        </div>
                        <p className='font-bold font-code text-muted-foreground'>{item.score}</p>
                    </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vault" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Knowledge Vault</CardTitle>
              <CardDescription>
                Your saved facts and highlights from challenges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-muted">
                <Vault className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Vault is Empty</h3>
                <p className="text-sm text-muted-foreground">
                  Save facts and highlights to review them here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
