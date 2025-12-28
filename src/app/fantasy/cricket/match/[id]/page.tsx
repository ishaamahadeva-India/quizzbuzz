
'use client';
import { useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Lock, Users, Flame, Zap, Trophy, BarChart, HelpCircle, User, Award } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
// import { SocialShare } from '@/components/social-share';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { useDoc, useCollection, useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { FantasyMatch, UserProfile, CricketerProfile, FantasyRoleSelection, UserPrediction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


// --- MOCK DATA (to be replaced with Firestore data) ---
const matchDetails = {
  id: 'live-match-1',
  title: 'IND vs AUS',
  series: 'T20 World Cup Final',
  status: 'Live',
};

const roles = {
  '1st-innings': [
    {
      id: 'powerplay-king',
      title: 'Powerplay King (Batting)',
      description: 'Scores most runs in overs 1-6.',
    },
    {
      id: 'new-ball-striker',
      title: 'New Ball Striker (Bowling)',
      description: 'Takes most wickets with the new ball.',
    },
  ],
  '2nd-innings': [
    {
      id: 'middle-overs-anchor',
      title: 'Middle Overs Anchor (Batting)',
      description: 'Scores most runs between overs 7-15.',
    },
    {
      id: 'death-overs-finisher',
      title: 'Death Overs Finisher (Batting)',
      description: 'Scores most runs with a high strike rate in overs 16-20.',
    },
  ]
};


const livePredictions = [
    { id: 'pred-1', type: 'yesno' as const, question: 'Will a wicket fall in the first 3 overs?', outcome: false, phase: 'Powerplay'},
    { id: 'pred-2', type: 'range' as const, question: 'How many runs will be scored in the Powerplay (1-6 overs)?', options: ['31-40', '41-50', '51-60', '61+'], outcome: '51-60', phase: 'Powerplay'},
    { id: 'pred-3', type: 'ranking' as const, question: 'Rank the top run-scorer in the first 10 overs.', options: ['c1', 'c3', 'c5'], outcome: ['c1', 'c5', 'c3'], phase: 'Middle Overs'},
    { id: 'pred-4', type: 'yesno' as const, question: 'Will a player score a 50?', outcome: true, phase: 'Middle Overs'},
    { id: 'pred-5', type: 'range' as const, question: 'Total boundaries (4s + 6s) in overs 7-15?', options: ['5-8', '9-12', '13+'], outcome: '9-12', phase: 'Middle Overs'},
    { id: 'pred-6', type: 'yesno' as const, question: 'Will the final score be over 180?', outcome: true, phase: 'Death Overs'},
    { id: 'pred-7', type: 'range' as const, question: 'Runs in the final 2 overs (19-20)?', options: ['10-19', '20-29', '30+'], outcome: '20-29', phase: 'Death Overs'},
    { id: 'pred-8', type: 'yesno' as const, question: 'Will there be a caught dismissal in the death overs?', outcome: true, phase: 'Death Overs'},
    // 2nd Innings Predictions
    { id: 'pred-9', type: 'yesno' as const, question: 'Will the chasing team score 50+ in their powerplay?', outcome: true, phase: 'Powerplay'},
    { id: 'pred-10', type: 'range' as const, question: 'What will the run rate be after 10 overs?', options: ['7.0-7.9', '8.0-8.9', '9.0+'], outcome: '8.0-8.9', phase: 'Middle Overs'},
    { id: 'pred-11', type: 'yesno' as const, question: 'Will the match go to the final over?', outcome: true, phase: 'Death Overs'},
    { id: 'pred-12', type: 'range' as const, question: 'How many wickets will fall in the entire match?', options: ['1-5', '6-10', '11+'], outcome: '6-10', phase: 'Overall'},
];


const leaderboardData = [
  { rank: 1, name: 'CricketFan1', score: 120 },
  { rank: 2, name: 'You', score: 110 },
  { rank: 3, name: 'StrategicThinker', score: 105 },
  { rank: 4, name: 'ThePredictor', score: 95 },
  { rank: 5, name: 'LuckyGuess', score: 80 },
];


function PlayerSelectionCard({
  player,
  isSelected,
  isDisabled,
  onSelect,
}: {
  player: any;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      onClick={onSelect}
      className={cn(
        'p-3 text-center transition-all cursor-pointer relative overflow-hidden',
        isSelected && 'border-primary ring-2 ring-primary',
        isDisabled && 'opacity-50 cursor-not-allowed bg-white/5'
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="check-icon"
          className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"
        >
          <Check className="w-4 h-4" />
        </motion.div>
      )}
      <Image
        src={player.avatarUrl || `https://picsum.photos/seed/${player.id}/400/400`}
        alt={player.name}
        width={80}
        height={80}
        className="rounded-full mx-auto"
      />
      <p className="font-semibold mt-2 text-sm truncate">{player.name}</p>
    </Card>
  );
}


function ScoringRulesCard() {
    return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-xl"><HelpCircle className="w-6 h-6"/> Event Types by Format</CardTitle>
                <CardDescription>Prediction events are tailored to the unique rhythm of each cricket format.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="t20" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="t20">T20 / IPL</TabsTrigger>
                        <TabsTrigger value="odi">ODI</TabsTrigger>
                        <TabsTrigger value="test">Test</TabsTrigger>
                    </TabsList>
                    <TabsContent value="t20" className="mt-4 prose prose-sm prose-invert max-w-none">
                        <p>High-paced action with a focus on explosive moments.</p>
                        <ul>
                            <li><strong>Powerplay Mayhem:</strong> Runs, boundaries, or wickets in the first 6 overs.</li>
                            <li><strong>Mid-Game Moments:</strong> Next dismissal method, will a fifty be scored?</li>
                            <li><strong>Death Overs Drama:</strong> Runs in final overs, end-of-innings strike rates.</li>
                        </ul>
                    </TabsContent>
                    <TabsContent value="odi" className="mt-4 prose prose-sm prose-invert max-w-none">
                        <p>Strategic ebbs and flows across three distinct phases of play.</p>
                        <ul>
                            <li><strong>Opening Foundation:</strong> Score at the 10-over mark, opening partnership runs.</li>
                            <li><strong>Middle Overs Consolidation:</strong> Partnership milestones, runs against specific bowlers.</li>
                            <li><strong>Endgame Acceleration:</strong> Final score predictions, total sixes in the innings.</li>
                        </ul>
                    </TabsContent>
                    <TabsContent value="test" className="mt-4 prose prose-sm prose-invert max-w-none">
                        <p>A session-by-session tactical battle of endurance and strategy.</p>
                        <ul>
                            <li><strong>Per Session:</strong> Wickets to fall, runs scored, will a player reach a milestone?</li>
                            <li><strong>Per Day:</strong> End-of-day score, lead/deficit prediction.</li>
                            <li><strong>Match-Level:</strong> Follow-on possibility, final match result (win/loss/draw).</li>
                        </ul>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function PreMatchView({ onLockSelections, players }: { onLockSelections: () => void, players: (CricketerProfile & {id: string})[] }) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  const handleSelectPlayer = (roleId: string, playerId: string) => {
    setSelections((prev) => ({
      ...prev,
      [roleId]: prev[roleId] === playerId ? '' : playerId,
    }));
  };

  const handleLock = () => {
    if (
      Object.values(selections).filter(Boolean).length !==
      roles['1st-innings'].length
    ) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Selections',
        description: 'Please select one player for each role.',
      });
      return;
    }
    setIsLocked(true);
    toast({
      title: 'Selections Locked for 1st Innings!',
      description: 'Good luck! The match is about to go live.',
    });
    setTimeout(() => onLockSelections(), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Pre-Match Selections
            </CardTitle>
            <CardDescription>
              Lock in your player roles for the 1st innings before the match
              begins. Your choices cannot be changed after locking.
            </CardDescription>
          </CardHeader>
        </Card>

        {roles['1st-innings'].map((role) => (
          <div key={role.id}>
            <h3 className="text-xl font-bold font-headline mb-1 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" /> {role.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {role.description}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {players.map((player) => (
                <PlayerSelectionCard
                  key={`${role.id}-${player.id}`}
                  player={player}
                  isSelected={selections[role.id] === player.id}
                  isDisabled={
                    isLocked ||
                    (!!selections[role.id] && selections[role.id] !== player.id)
                  }
                  onSelect={() =>
                    !isLocked && handleSelectPlayer(role.id, player.id)
                  }
                />
              ))}
            </div>
          </div>
        ))}
        
        <ScoringRulesCard />

        <div className="sticky bottom-6 z-10">
          <Button
            onClick={handleLock}
            disabled={isLocked}
            size="lg"
            className="w-full shadow-2xl shadow-primary/20"
          >
            <Lock className="w-5 h-5 mr-2" />
            {isLocked ? `Selections Locked` : `Lock Selections for 1st Innings`}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Prediction Components ---

function YesNoPrediction({ prediction, onLock, status }: { prediction: any, onLock: (pred: any) => void, status: string }) {
    const [answer, setAnswer] = useState<boolean | null>(null);
    const [confidence, setConfidence] = useState(1); // 0=Low, 1=Medium, 2=High

    const handleLock = () => {
        if (answer === null) {
             toast({ variant: 'destructive', title: 'No Answer', description: 'Please select Yes or No.'});
             return;
        }
        onLock({ answer, confidence });
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setAnswer(true)} disabled={status !== 'predicting'} variant={answer === true ? 'default' : 'outline'} className="h-20 text-xl">Yes</Button>
            <Button onClick={() => setAnswer(false)} disabled={status !== 'predicting'} variant={answer === false ? 'default' : 'outline'} className="h-20 text-xl">No</Button>
        </div>
        <div className="space-y-3 pt-4">
            <Label htmlFor="confidence-slider" className="font-semibold">Confidence</Label>
            <Slider
                id="confidence-slider"
                min={0} max={2} step={1}
                value={[confidence]}
                onValueChange={(val) => setConfidence(val[0])}
                disabled={status !== 'predicting'}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span><span>Medium</span><span>High</span>
            </div>
        </div>
        <Button onClick={handleLock} disabled={status !== 'predicting'} size="lg" className="w-full">
            <Lock className="w-4 h-4 mr-2"/> Lock Prediction
        </Button>
      </div>
    );
}

function RangePrediction({ prediction, onLock, status }: { prediction: any, onLock: (pred: any) => void, status: string }) {
    const [answer, setAnswer] = useState<string | null>(null);
    const handleLock = () => {
        if (!answer) {
             toast({ variant: 'destructive', title: 'No Selection', description: 'Please select a range.'});
             return;
        }
        onLock({ answer });
    }

    return (
         <div className="space-y-4">
            <RadioGroup value={answer || ''} onValueChange={setAnswer} disabled={status !== 'predicting'} className="space-y-3">
                {prediction.options.map((option: string) => (
                    <Label key={option} htmlFor={option} className={`flex items-center gap-4 p-4 rounded-lg border-2 ${answer === option ? 'border-primary' : 'border-input'} cursor-pointer`}>
                        <RadioGroupItem value={option} id={option} />
                        <span className='font-semibold text-lg'>{option}</span>
                    </Label>
                ))}
            </RadioGroup>
            <Button onClick={handleLock} disabled={status !== 'predicting'} size="lg" className="w-full">
                <Lock className="w-4 h-4 mr-2"/> Lock Prediction
            </Button>
        </div>
    );
}

function RankingPrediction({ prediction, onLock, status, players }: { prediction: any, onLock: (pred: any) => void, status: string, players: (CricketerProfile & {id:string})[] }) {
    const getPlayerById = (id: string) => players.find(p => p.id === id);
    const [rankedPlayers, setRankedPlayers] = useState<string[]>([]);

    const handleSelectPlayer = (playerId: string) => {
        setRankedPlayers(prev => {
            if (prev.includes(playerId)) return prev;
            if (prev.length >= prediction.options.length) return prev;
            return [...prev, playerId];
        });
    }

    const handleLock = () => {
        if(rankedPlayers.length < prediction.options.length) {
             toast({ variant: 'destructive', title: 'Incomplete Ranking', description: `Please rank all ${prediction.options.length} players.`});
             return;
        }
        onLock({ answer: rankedPlayers });
    }

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold mb-2">Your Ranking</h4>
                <div className="p-2 rounded-lg bg-background min-h-[140px] space-y-2">
                    {rankedPlayers.map((pId, index) => {
                        const player = getPlayerById(pId);
                        return (
                            <div key={pId} className="flex items-center gap-2 p-2 bg-white/5 rounded-md">
                                <span className="font-bold font-code text-lg w-6">{index + 1}.</span>
                                <Image src={player?.avatarUrl || ''} alt={player?.name || ''} width={32} height={32} className="rounded-full" />
                                <span>{player?.name}</span>
                            </div>
                        )
                    })}
                </div>
                <Button variant="link" onClick={() => setRankedPlayers([])} disabled={status !== 'predicting'}>Reset</Button>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Select Players in Order</h4>
                <div className="grid grid-cols-3 gap-2">
                    {prediction.options.map((pId: string) => {
                        const player = getPlayerById(pId);
                        const isSelected = rankedPlayers.includes(pId);
                        return (
                            <Card key={pId} onClick={() => handleSelectPlayer(pId)} className={cn('p-2 text-center cursor-pointer', isSelected && 'opacity-50')}>
                                <Image src={player?.avatarUrl || ''} alt={player?.name || ''} width={40} height={40} className="rounded-full mx-auto" />
                                <p className="text-xs mt-1 truncate">{player?.name}</p>
                            </Card>
                        )
                    })}
                </div>
            </div>
            <Button onClick={handleLock} disabled={status !== 'predicting'} size="lg" className="w-full">
                <Lock className="w-4 h-4 mr-2"/> Lock Ranking
            </Button>
        </div>
    );
}

function getPointsForResult(prediction: any, userAnswer: any) {
    const confidenceLabels = ["Low", "Medium", "High"];
    const pointsMap = { 'Low': {correct: 10, incorrect: -2}, 'Medium': {correct: 15, incorrect: -5}, 'High': {correct: 20, incorrect: -10} };

    if (!userAnswer) return -5; // Penalty for not answering

    switch(prediction.type) {
        case 'yesno': {
            const isCorrect = userAnswer.answer === prediction.outcome;
            const confidence = userAnswer.confidence;
            const confidenceLabel = confidenceLabels[confidence] as keyof typeof pointsMap;
            return isCorrect ? pointsMap[confidenceLabel].correct : pointsMap[confidenceLabel].incorrect;
        }
        case 'range': {
            if (!userAnswer.answer) return -5;
            const isCorrect = userAnswer.answer === prediction.outcome;
            if (isCorrect) return 25;
            const options = prediction.options;
            const correctIndex = options.indexOf(prediction.outcome);
            const userIndex = options.indexOf(userAnswer.answer);
            if (Math.abs(correctIndex - userIndex) === 1) return 15;
            return -5;
        }
        case 'ranking': {
            let score = 0;
            if (!userAnswer.answer) return score;
            userAnswer.answer.forEach((pId: string, index: number) => {
                if (prediction.outcome[index] === pId) score += 20; // Exact rank
                else if (prediction.outcome.includes(pId)) score += 10; // Off by one
            });
            return Math.round(score / prediction.options.length);
        }
        default: return 0;
    }
}


function FirstInningsView({ onInningsEnd, currentStreak, setStreak, onScoreUpdate, players }: { onInningsEnd: () => void, currentStreak: number, setStreak: (streak: number) => void, onScoreUpdate: (points: number) => void, players: (CricketerProfile & {id: string})[] }) {
    type PredictionStatus = 'predicting' | 'locked' | 'waiting' | 'result';
    const [currentPredIndex, setCurrentPredIndex] = useState(0);
    const [userPredictions, setUserPredictions] = useState<Record<number, any>>({});
    const [status, setStatus] = useState<PredictionStatus>('predicting');
    
    const currentPrediction = livePredictions[currentPredIndex];

    const handleLockPrediction = (predictionData: any) => {
        setStatus('locked');
        setUserPredictions(prev => ({...prev, [currentPredIndex]: predictionData}));
        
        toast({ title: 'Prediction Locked!' });
        
        // Simulate waiting for outcome
        setTimeout(() => {
            setStatus('waiting');
            setTimeout(() => {
                setStatus('result');

                const points = getPointsForResult(currentPrediction, predictionData);
                onScoreUpdate(points);
                if (points > 0) {
                    setStreak(currentStreak + 1);
                } else {
                    setStreak(0);
                }

                // Wait to show result before moving on
                setTimeout(() => {
                    if (currentPredIndex < livePredictions.length - 1) {
                        setCurrentPredIndex(prev => prev + 1);
                        setStatus('predicting');
                    } else {
                        onInningsEnd();
                    }
                }, 3000);
            }, 2000);
        }, 500);
    };

    const renderPredictionComponent = () => {
        switch(currentPrediction.type) {
            case 'yesno':
                return <YesNoPrediction prediction={currentPrediction} onLock={handleLockPrediction} status={status}/>
            case 'range':
                return <RangePrediction prediction={currentPrediction} onLock={handleLockPrediction} status={status}/>
            case 'ranking':
                return <RankingPrediction prediction={currentPrediction} onLock={handleLockPrediction} status={status} players={players as any as (CricketerProfile & { id: string })[]}/>
            default:
                return <p>Unsupported prediction type</p>;
        }
    }
    
    if (!currentPrediction) {
        return <p>Loading predictions...</p>
    }

    const points = status === 'result' ? getPointsForResult(currentPrediction, userPredictions[currentPredIndex]) : 0;

    return (
        <div className="space-y-8">
             <AnimatePresence mode="wait">
                 <motion.div
                    key={currentPredIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center justify-center gap-2"><Zap className="w-6 h-6 text-primary"/> Live Prediction</CardTitle>
                            <CardDescription>Prediction {currentPredIndex + 1} of {livePredictions.length}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-2xl font-semibold text-balance min-h-[64px]">{currentPrediction.question}</p>
                            {renderPredictionComponent()}
                             {status !== 'predicting' && (
                                <div className='mt-4 min-h-[40px]'>
                                    {status === 'locked' && <p className='font-semibold text-primary animate-pulse'>Prediction Locked! Waiting for event...</p>}
                                    {status === 'waiting' && <p className='font-semibold text-muted-foreground animate-pulse'>Waiting for outcome...</p>}
                                    {status === 'result' && (
                                        <p className={`text-lg font-bold ${points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {points > 0 ? `Correct! +${points} Points` : `Incorrect! ${points} Points`}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function InningsBreakView({ onStartNextInnings }: { onStartNextInnings: () => void }) {
    return (
        <div className="text-center space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Innings Break</CardTitle>
                    <CardDescription>Review the 1st innings and prepare your roles for the 2nd innings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The 2nd Innings selection will begin shortly...</p>
                </CardContent>
                 <CardFooter className="justify-center">
                     <Button onClick={onStartNextInnings}>Start 2nd Innings Selections</Button>
                </CardFooter>
            </Card>
        </div>
    )
}


function SecondInningsSelectionView({ onLockSelections, players }: { onLockSelections: () => void, players: (CricketerProfile & {id: string})[] }) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  const handleSelectPlayer = (roleId: string, playerId: string) => {
    setSelections((prev) => ({
      ...prev,
      [roleId]: prev[roleId] === playerId ? '' : playerId,
    }));
  };

  const handleLock = () => {
    if (
      Object.values(selections).filter(Boolean).length !==
      roles['2nd-innings'].length
    ) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Selections',
        description: 'Please select one player for each role.',
      });
      return;
    }
    setIsLocked(true);
    toast({
      title: 'Selections Locked for 2nd Innings!',
      description: 'The chase is about to begin.',
    });
    setTimeout(() => onLockSelections(), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              2nd Innings Selections
            </CardTitle>
            <CardDescription>
             Select your player roles for the chase. Your choices cannot be changed after locking.
            </CardDescription>
          </CardHeader>
        </Card>

        {roles['2nd-innings'].map((role) => (
          <div key={role.id}>
            <h3 className="text-xl font-bold font-headline mb-1 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" /> {role.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {role.description}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {players.map((player) => (
                <PlayerSelectionCard
                  key={`${role.id}-${player.id}`}
                  player={player}
                  isSelected={selections[role.id] === player.id}
                  isDisabled={
                    isLocked ||
                    (!!selections[role.id] && selections[role.id] !== player.id)
                  }
                  onSelect={() =>
                    !isLocked && handleSelectPlayer(role.id, player.id)
                  }
                />
              ))}
            </div>
          </div>
        ))}
        
        <div className="sticky bottom-6 z-10">
          <Button
            onClick={handleLock}
            disabled={isLocked}
            size="lg"
            className="w-full shadow-2xl shadow-primary/20"
          >
            <Lock className="w-5 h-5 mr-2" />
            {isLocked ? `Selections Locked` : `Lock Selections for 2nd Innings`}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


function LeaderboardView({ match }: { match: FantasyMatch }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Match Leaderboard</CardTitle>
                <CardDescription>Live rankings for the {match.matchName || `${match.team1} vs ${match.team2}`} match.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {leaderboardData.map((player) => (
                        <div key={player.rank} className={`flex items-center p-4 rounded-lg ${player.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'}`}>
                            <div className="flex items-center gap-4 w-full">
                                <span className="font-bold font-code text-lg w-8 text-center text-muted-foreground">
                                    {player.rank}
                                </span>
                                <div className="flex items-center gap-3">
                                    <User className="w-6 h-6 text-muted-foreground"/>
                                    <span className="font-semibold">{player.name}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2 font-bold font-code text-primary text-lg">
                                    <Award className="w-5 h-5 text-amber-400" />
                                    {player.score}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

type MatchPhase = 'pre-match' | '1st-innings' | 'innings-break' | '2nd-innings-selection' | '2nd-innings-live' | 'match-over';


export default function CricketMatchPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('pre-match');
  const [activeTab, setActiveTab] = useState('game');
  const [currentScore, setCurrentScore] = useState(110);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Fetch match from Firestore
  const matchRef = firestore ? doc(firestore, 'fantasy_matches', id) : null;
  const { data: matchData, isLoading: matchLoading } = useDoc(matchRef);
  const match = matchData ? { ...matchData, id } as FantasyMatch : null;

  const playersQuery = firestore ? collection(firestore, 'cricketers') : null;
  const { data: players, isLoading: playersLoading } = useCollection(playersQuery);

  // Show loading state
  if (matchLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Show 404 if match doesn't exist
  if (!match) {
    return notFound();
  }

  if (!players) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const handleScoreUpdate = (points: number) => {
    setCurrentScore(prev => prev + points);
    const updatedLeaderboard = leaderboardData.map(p => p.name === 'You' ? {...p, score: currentScore + points} : p).sort((a,b) => b.score - a.score);
    // In a real app, this would be a state update for the leaderboard component
  }

  const renderGameContent = () => {
    switch(matchPhase) {
      case 'pre-match':
        return <PreMatchView onLockSelections={() => setMatchPhase('1st-innings')} players={players as any as (CricketerProfile & { id: string })[]} />;
      case '1st-innings':
        return <FirstInningsView onInningsEnd={() => setMatchPhase('innings-break')} currentStreak={currentStreak} setStreak={setCurrentStreak} onScoreUpdate={handleScoreUpdate} players={players as any as (CricketerProfile & { id: string })[]} />;
      case 'innings-break':
        return <InningsBreakView onStartNextInnings={() => setMatchPhase('2nd-innings-selection')} />;
      case '2nd-innings-selection':
        return <SecondInningsSelectionView onLockSelections={() => setMatchPhase('2nd-innings-live')} players={players as any as (CricketerProfile & { id: string })[]} />;
      case '2nd-innings-live':
        return <FirstInningsView onInningsEnd={() => setMatchPhase('match-over')} currentStreak={currentStreak} setStreak={setCurrentStreak} onScoreUpdate={handleScoreUpdate} players={players as any as (CricketerProfile & { id: string })[]}/>; // Re-use for simulation
      case 'match-over':
        return <Card><CardHeader><CardTitle>Match Over!</CardTitle><CardContent><p>Final leaderboard is now available.</p></CardContent></CardHeader></Card>;
      default:
        return <p>Loading match...</p>;
    }
  }


  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 md:gap-8">
            <div className="flex-1">
                <Button variant="ghost" asChild className='mb-2 -ml-2 md:-ml-4'>
                    <Link href="/fantasy/cricket">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Back to All Matches</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                </Button>
                 <h1 className="text-3xl font-bold md:text-4xl font-headline">
                    {match.matchName || `${match.team1} vs ${match.team2}`}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {match.description || `${match.format} Match`}
                </p>
            </div>
            {/* <SocialShare
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={matchDetails.title + ' - Live Fantasy Match'}
              description={'Join the live fantasy match: ' + matchDetails.series}
              variant="outline"
            /> */}
       </div>
       <div className='grid grid-cols-2 gap-4'>
                <Card className="text-center p-4">
                    <CardDescription>Total Score</CardDescription>
                    <CardTitle className="font-code text-4xl text-primary">{currentScore}</CardTitle>
                </Card>
                 <Card className="text-center p-4">
                    <CardDescription>Current Streak</CardDescription>
                    <CardTitle className="font-code text-4xl text-amber-400 flex items-center justify-center gap-1">
                        <Flame className='w-8 h-8' />
                        {currentStreak}
                    </CardTitle>
                </Card>
            </div>

       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="game">Game</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="game" className="mt-6">
                {renderGameContent()}
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-6">
                <LeaderboardView match={match} />
            </TabsContent>
        </Tabs>
      
       <Card className="text-center bg-transparent border-dashed">
            <CardHeader>
                <CardTitle className="font-headline text-lg">Skill Declaration</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>This is a skill-based cricket strategy and prediction game. Outcomes depend on the user’s knowledge, analysis, and timing. There is no element of chance or randomness.</p>
            </CardContent>
             <CardFooter className="justify-center text-xs text-muted-foreground">
                <p>This game is open only to users aged 18 years and above.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
