
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  handleEmailSignIn,
  handleGoogleSignIn,
  handleGoogleSignInRedirect,
} from '@/firebase/auth/auth-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  // Handle redirect result from Google sign-in
  useEffect(() => {
    if (auth && firestore) {
      handleGoogleSignInRedirect(auth, firestore).then((user) => {
        if (user) {
          toast({
            title: 'Signed In',
            description: "You've been successfully signed in.",
          });
          router.push('/profile');
        }
      });
    }
  }, [auth, firestore, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth || !firestore) return;
    const error = await handleEmailSignIn(auth, firestore, values.email, values.password);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error,
      });
    } else {
      toast({
        title: 'Signed In',
        description: "You've been successfully signed in.",
      });
      router.push('/profile');
    }
  };

  const onGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    try {
      // Redirect flow - user will be redirected to Google, then back to app
      // The useEffect above will handle the result when they return
      await handleGoogleSignIn(auth, firestore);
      // No need to navigate here - user is being redirected
    } catch (error: any) {
      // Only show error if it's not a redirect (redirect is expected behavior)
      if (!error?.message?.includes('redirect') && error?.code !== 'auth/redirect-cancelled-by-user') {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: error?.message || 'Failed to sign in with Google.',
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your profile and fantasy games.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        {...field}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={!auth}>
                Sign In
              </Button>
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={!auth || !firestore}>
            <LogIn className="mr-2 h-4 w-4" /> Google
          </Button>
        </CardContent>
        {/* Short Disclosure */}
        <CardContent className="pt-0">
          <p className="text-xs text-center text-muted-foreground px-4">
            Free-to-play skill-based contests with sponsor-funded non-cash rewards. No entry fee. No cash prizes.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
