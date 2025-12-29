
'use client';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Clock, Sparkles } from 'lucide-react';

export default function PlayPage() {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
        <div>
            <h1 className="text-3xl font-bold md:text-4xl font-headline">
                Challenge Lobby
            </h1>
            <p className="mt-2 text-muted-foreground">
                Engage with our skill-based games to challenge your intellect and learn something new.
            </p>
        </div>
        
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-primary/20 animate-pulse" />
              </div>
              <Clock className="w-16 h-16 text-primary relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline">
                Coming Soon
              </h2>
              <p className="text-muted-foreground max-w-md">
                We're working hard to bring you exciting new games and challenges. 
                Stay tuned for Version 2.0!
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                In the meantime, explore our <span className="font-semibold text-foreground">Fantasy Cricket</span> and <span className="font-semibold text-foreground">Movie Fan Zone</span>!
              </p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
