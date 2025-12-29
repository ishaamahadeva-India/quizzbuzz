'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, Sparkles } from 'lucide-react';

export default function SoundstrikePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md text-center border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-12 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-24 h-24 text-primary/20 animate-pulse" />
            </div>
            <Clock className="w-16 h-16 text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-headline">
              Coming Soon
            </CardTitle>
            <p className="text-muted-foreground">
              Soundstrike Quiz will be available in Version 2.0. Stay tuned!
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              In the meantime, try our <span className="font-semibold text-foreground">Movie Quiz</span> in the Fan Zone!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
