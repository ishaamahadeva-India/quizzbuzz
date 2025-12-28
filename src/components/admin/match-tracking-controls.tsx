'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMatchTracking } from '@/hooks/use-match-tracking';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type MatchTrackingControlsProps = {
  matchId: string;
  format: 'T20' | 'ODI' | 'Test' | 'IPL';
};

/**
 * Admin component for controlling match tracking and state
 * Use this in admin panels to manually control match progress
 */
export function MatchTrackingControls({ matchId, format }: MatchTrackingControlsProps) {
  const [manualOver, setManualOver] = useState<number>(0);
  const [autoIncrement, setAutoIncrement] = useState(false);

  const {
    isTracking,
    currentOver,
    currentInnings,
    handleMatchStart,
    handleOverComplete,
    handleInningsBreak,
    handleSecondInningsStart,
    handleMatchComplete,
    setOver,
  } = useMatchTracking({
    matchId,
    format,
    autoIncrement,
    incrementInterval: 60, // 1 minute per over for demo
  });

  const handleManualOverSet = async () => {
    if (manualOver < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Over',
        description: 'Over number must be 0 or greater.',
      });
      return;
    }

    await setOver(manualOver);
    toast({
      title: 'Over Updated',
      description: `Match state set to Over ${manualOver}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Tracking Controls</CardTitle>
        <CardDescription>
          Control match state and progress. Use this to simulate match progression or update real match state.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Current Over</Label>
            <p className="text-2xl font-bold">{currentOver}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Innings</Label>
            <p className="text-2xl font-bold">{currentInnings}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant={isTracking ? 'default' : 'secondary'}>
              {isTracking ? 'Tracking' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {/* Match Control Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleMatchStart}
            disabled={isTracking}
            variant="default"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Match
          </Button>
          <Button
            onClick={handleOverComplete}
            disabled={!isTracking}
            variant="outline"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Complete Over
          </Button>
          <Button
            onClick={handleInningsBreak}
            disabled={!isTracking || currentInnings !== 1}
            variant="outline"
          >
            Start Innings Break
          </Button>
          <Button
            onClick={handleSecondInningsStart}
            disabled={!isTracking || currentInnings !== 1}
            variant="outline"
          >
            Start 2nd Innings
          </Button>
          <Button
            onClick={handleMatchComplete}
            disabled={!isTracking}
            variant="destructive"
            className="col-span-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Complete Match
          </Button>
        </div>

        {/* Auto-Increment Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Auto-Increment Overs</Label>
            <p className="text-sm text-muted-foreground">
              Automatically increment over every 60 seconds (for demo/testing)
            </p>
          </div>
          <Button
            variant={autoIncrement ? 'default' : 'outline'}
            onClick={() => setAutoIncrement(!autoIncrement)}
            disabled={!isTracking}
          >
            {autoIncrement ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Manual Over Set */}
        <div className="space-y-2">
          <Label>Manually Set Over Number</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={manualOver}
              onChange={(e) => setManualOver(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="Enter over number"
            />
            <Button onClick={handleManualOverSet} variant="outline">
              Set Over
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use this to jump to a specific over number (for testing or corrections)
          </p>
        </div>

        {/* Format Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm">
            <strong>Format:</strong> {format}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format === 'T20' || format === 'IPL'
              ? '20 overs per innings'
              : format === 'ODI'
              ? '50 overs per innings'
              : '90 overs per day (Test match)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

