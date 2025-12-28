'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CRICKET_EVENT_TEMPLATES } from '@/firebase/firestore/cricket-matches';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const cricketEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  eventType: z.enum([
    'powerplay_runs', 'powerplay_wickets', 'powerplay_boundaries', 'powerplay_sixes',
    'first_ball_runs', 'first_boundary', 'first_six', 'first_wicket',
    'first_50_partnership', 'first_100_partnership', 'highest_individual_score',
    'most_boundaries', 'most_sixes', 'strike_rate_range',
    'first_wicket_bowler', 'most_wickets', 'best_economy', 'maiden_overs',
    'hat_trick', 'first_5_wicket_haul',
    'toss_winner', 'toss_decision', 'match_winner', 'win_margin',
    'win_by_wickets_or_runs', 'total_runs', 'total_wickets', 'total_fours',
    'total_sixes', 'total_extras',
    'first_innings_score', 'second_innings_score', 'first_innings_wickets',
    'second_innings_wickets',
    'first_innings_lead', 'follow_on', 'declaration', 'century_count', 'fifty_count',
    '300_plus_score', '400_plus_score', 'chase_successful',
    '200_plus_score', 'fastest_50', 'fastest_100', 'super_over', 'drs_reviews', 'timeout_taken',
  ]),
  innings: z.number().optional(),
  status: z.enum(['upcoming', 'live', 'completed', 'locked']),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  lockTime: z.date().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  options: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

const matchSchema = z.object({
  matchName: z.string().min(1, 'Match name is required'),
  format: z.enum(['T20', 'ODI', 'Test', 'IPL']),
  team1: z.string().min(1, 'Team 1 is required'),
  team2: z.string().min(1, 'Team 2 is required'),
  venue: z.string().optional(),
  startTime: z.date(),
  status: z.enum(['upcoming', 'live', 'completed']),
  description: z.string().optional(),
  entryFee: z.object({
    type: z.enum(['free', 'paid']),
    amount: z.number().optional(),
  }).optional(),
  maxParticipants: z.number().optional(),
  tournamentId: z.string().optional(), // Link to tournament
  events: z.array(cricketEventSchema).optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

type CricketMatchFormProps = {
  onSubmit: (data: MatchFormValues) => void;
  defaultValues?: Partial<MatchFormValues>;
};

export function CricketMatchForm({ onSubmit, defaultValues }: CricketMatchFormProps) {
  const firestore = useFirestore();
  const tournamentsQuery = firestore ? collection(firestore, 'cricket-tournaments') : null;
  const { data: tournaments } = useCollection(tournamentsQuery);

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      status: 'upcoming',
      format: 'T20',
      events: [],
      entryFee: { type: 'free' },
      tournamentId: defaultValues?.tournamentId || '',
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  const selectedFormat = form.watch('format');
  const selectedTournamentId = form.watch('tournamentId');
  const [selectedEventIndices, setSelectedEventIndices] = React.useState<Set<number>>(new Set());

  // Normalize format: Treat IPL as T20 for filtering
  const normalizedFormat = selectedFormat === 'IPL' ? 'T20' : selectedFormat;

  // Filter events by format
  const availableTemplates = CRICKET_EVENT_TEMPLATES.filter((template) => {
    // Common events (no applicableFormats) apply to all formats
    if (!template.applicableFormats || template.applicableFormats.length === 0) {
      return true;
    }
    
    // Check if the selected format (or normalized format) is in the template's applicable formats
    // Also handle IPL -> T20 mapping
    const formatsToCheck = normalizedFormat === 'T20' 
      ? ['T20', 'IPL'] 
      : [normalizedFormat];
    
    return template.applicableFormats.some(format => formatsToCheck.includes(format));
  });

  // Separate events into format-specific and common, preserving original indices
  const formatSpecificEvents = availableTemplates
    .map((template, filteredIndex) => {
      const originalIndex = CRICKET_EVENT_TEMPLATES.findIndex(t => 
        t.title === template.title && t.eventType === template.eventType
      );
      return { template, originalIndex, filteredIndex };
    })
    .filter(item => item.template.applicableFormats && item.template.applicableFormats.length > 0);
  
  const commonEvents = availableTemplates
    .map((template, filteredIndex) => {
      const originalIndex = CRICKET_EVENT_TEMPLATES.findIndex(t => 
        t.title === template.title && t.eventType === template.eventType
      );
      return { template, originalIndex, filteredIndex };
    })
    .filter(item => !item.template.applicableFormats || item.template.applicableFormats.length === 0);

  // Group format-specific events by category (using original index)
  const groupedFormatSpecificEvents = React.useMemo(() => {
    const grouped: Record<string, Array<{ template: typeof CRICKET_EVENT_TEMPLATES[0]; index: number }>> = {};
    formatSpecificEvents.forEach(({ template, originalIndex }) => {
      const category = template.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ template, index: originalIndex });
    });
    return grouped;
  }, [formatSpecificEvents]);

  // Group common events by category (using original index)
  const groupedCommonEvents = React.useMemo(() => {
    const grouped: Record<string, Array<{ template: typeof CRICKET_EVENT_TEMPLATES[0]; index: number }>> = {};
    commonEvents.forEach(({ template, originalIndex }) => {
      const category = template.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ template, index: originalIndex });
    });
    return grouped;
  }, [commonEvents]);

  const addEventFromTemplate = (template: typeof CRICKET_EVENT_TEMPLATES[0]) => {
    append({
      title: template.title,
      description: template.description,
      eventType: template.eventType as any,
      status: 'upcoming',
      points: template.defaultPoints,
      difficultyLevel: template.difficultyLevel,
      options: template.defaultOptions || [],
      rules: template.defaultRules || [],
    });
  };

  const toggleEventSelection = (index: number) => {
    const newSet = new Set(selectedEventIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedEventIndices(newSet);
  };

  const toggleCategorySelection = (category: string, isCommon: boolean = false) => {
    const categoryEvents = isCommon 
      ? (groupedCommonEvents[category] || [])
      : (groupedFormatSpecificEvents[category] || []);
    const categoryIndices = categoryEvents.map(e => e.index);
    const allSelected = categoryIndices.length > 0 && categoryIndices.every(idx => selectedEventIndices.has(idx));
    
    const newSet = new Set(selectedEventIndices);
    if (allSelected) {
      categoryIndices.forEach(idx => newSet.delete(idx));
    } else {
      categoryIndices.forEach(idx => newSet.add(idx));
    }
    setSelectedEventIndices(newSet);
  };

  const addSelectedEvents = () => {
    selectedEventIndices.forEach(index => {
      // Use original template index from CRICKET_EVENT_TEMPLATES
      const template = CRICKET_EVENT_TEMPLATES[index];
      if (template) {
        addEventFromTemplate(template);
      }
    });
    setSelectedEventIndices(new Set());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Match Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="matchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CSK vs MI - IPL 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="T20">T20</SelectItem>
                        <SelectItem value="IPL">IPL</SelectItem>
                        <SelectItem value="ODI">ODI</SelectItem>
                        <SelectItem value="Test">Test</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wankhede Stadium, Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="team1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team 1</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chennai Super Kings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team 2</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai Indians" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Match Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP p')
                            ) : (
                              <span>Pick date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Match description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tournamentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Tournament (Optional)</FormLabel>
                  <FormDescription>
                    Select a tournament to link this match to. This helps organize matches within tournaments.
                  </FormDescription>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tournament (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Standalone Match)</SelectItem>
                      {tournaments && tournaments.length > 0 ? (
                        tournaments.map((tournament: any) => (
                          <SelectItem key={tournament.id} value={tournament.id}>
                            {tournament.name} ({tournament.format})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tournaments" disabled>No tournaments available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTournamentId && (
                    <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          Linked to: {tournaments?.find((t: any) => t.id === selectedTournamentId)?.name || 'Tournament'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange('')}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryFee.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'free'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free Entry</SelectItem>
                        <SelectItem value="paid">Paid Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('entryFee.type') === 'paid' && (
                <FormField
                  control={form.control}
                  name="entryFee.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 99"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Match Events ({fields.length} added)</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Events from Templates</DialogTitle>
                    <DialogDescription>
                      Select events for <strong>{selectedFormat}</strong> format.
                      <span className="ml-2 text-muted-foreground">
                        ({formatSpecificEvents.length} format-specific, {commonEvents.length} common)
                      </span>
                      {selectedEventIndices.size > 0 && (
                        <span className="ml-2 font-semibold text-primary">
                          {selectedEventIndices.size} selected
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 mt-4">
                    {/* Format-Specific Events */}
                    {Object.keys(groupedFormatSpecificEvents).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <Badge variant="default" className="text-sm">
                            {selectedFormat}-Specific Events
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({formatSpecificEvents.length} events)
                          </span>
                        </div>
                        {Object.entries(groupedFormatSpecificEvents).map(([category, events]) => {
                      const categoryIndices = events.map(e => e.index);
                      const allSelected = categoryIndices.length > 0 && categoryIndices.every(idx => selectedEventIndices.has(idx));
                      const someSelected = categoryIndices.some(idx => selectedEventIndices.has(idx));
                      
                      return (
                        <div key={`format-${category}`} className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg">{category}</h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCategorySelection(category, false)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {events.map(({ template, index }) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex items-start space-x-3 p-3 rounded-lg border",
                                  selectedEventIndices.has(index) && "bg-accent"
                                )}
                              >
                                <Checkbox
                                  checked={selectedEventIndices.has(index)}
                                  onCheckedChange={() => toggleEventSelection(index)}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold">{template.title}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {template.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {template.applicableFormats && template.applicableFormats.length > 0 && (
                                      <Badge variant="default" className="text-xs">
                                        {template.applicableFormats.join(', ')}
                                      </Badge>
                                    )}
                                    {(!template.applicableFormats || template.applicableFormats.length === 0) && (
                                      <Badge variant="secondary" className="text-xs">
                                        All Formats
                                      </Badge>
                                    )}
                                    <Badge variant="secondary">{template.eventType}</Badge>
                                    <Badge variant="outline">{template.defaultPoints} points</Badge>
                                    {template.difficultyLevel && (
                                      <Badge variant="outline">{template.difficultyLevel}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    )}

                    {/* Common Events (Applicable to All Formats) */}
                    {Object.keys(groupedCommonEvents).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <Badge variant="secondary" className="text-sm">
                            Common Events
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({commonEvents.length} events - Available for all formats)
                          </span>
                        </div>
                        {Object.entries(groupedCommonEvents).map(([category, events]) => {
                      const categoryIndices = events.map(e => e.index);
                      const allSelected = categoryIndices.length > 0 && categoryIndices.every(idx => selectedEventIndices.has(idx));
                      const someSelected = categoryIndices.some(idx => selectedEventIndices.has(idx));
                      
                      return (
                        <div key={`common-${category}`} className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg">{category}</h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCategorySelection(category, true)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {events.map(({ template, index }) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex items-start space-x-3 p-3 rounded-lg border",
                                  selectedEventIndices.has(index) && "bg-accent"
                                )}
                              >
                                <Checkbox
                                  checked={selectedEventIndices.has(index)}
                                  onCheckedChange={() => toggleEventSelection(index)}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold">{template.title}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {template.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {template.applicableFormats && template.applicableFormats.length > 0 && (
                                      <Badge variant="default" className="text-xs">
                                        {template.applicableFormats.join(', ')}
                                      </Badge>
                                    )}
                                    {(!template.applicableFormats || template.applicableFormats.length === 0) && (
                                      <Badge variant="secondary" className="text-xs">
                                        All Formats
                                      </Badge>
                                    )}
                                    <Badge variant="secondary">{template.eventType}</Badge>
                                    <Badge variant="outline">{template.defaultPoints} points</Badge>
                                    {template.difficultyLevel && (
                                      <Badge variant="outline">{template.difficultyLevel}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </div>

                  {selectedEventIndices.size > 0 && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedEventIndices(new Set())}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          addSelectedEvents();
                        }}
                      >
                        Add {selectedEventIndices.size} Event{selectedEventIndices.size !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events added yet. Click "Add Event" to add events from templates.
              </div>
            )}

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {form.watch(`events.${index}.title`) || `Event ${index + 1}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {form.watch(`events.${index}.eventType`)} • {form.watch(`events.${index}.points`)} points
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`events.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.points`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`events.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`events.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="locked">Locked</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.difficultyLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.innings`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Innings (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1 or 2"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch(`events.${index}.options`) && form.watch(`events.${index}.options`)!.length > 0 && (
                  <FormField
                    control={form.control}
                    name={`events.${index}.options`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Options (one per line)</FormLabel>
                        <FormControl>
                          <Textarea
                            value={field.value?.join('\n') || ''}
                            onChange={(e) => {
                              const options = e.target.value.split('\n').filter((o) => o.trim());
                              field.onChange(options);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Enter each option on a new line</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name={`events.${index}.rules`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rules (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => {
                            const rules = e.target.value.split('\n').filter((r) => r.trim());
                            field.onChange(rules);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Enter each rule on a new line</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}
          </CardContent>
        </Card>

        <Button type="submit">
          {defaultValues ? 'Update Match' : 'Create Match'}
        </Button>
      </form>
    </Form>
  );
}

