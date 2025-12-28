'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { getAllImageAdSponsors } from '@/firebase/firestore/image-ad-sponsors';
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TOURNAMENT_EVENT_TEMPLATES } from '@/firebase/firestore/cricket-tournaments';
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
import { Checkbox } from '@/components/ui/checkbox';

const tournamentEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  eventType: z.enum([
    'tournament_winner', 'tournament_runner_up', 'semi_finalists', 'finalists',
    'points_table_topper', 'group_topper', 'group_second_place', 'group_qualifiers',
    'group_team_points', 'top_run_scorer', 'top_wicket_taker', 'tournament_mvp',
    'most_sixes', 'best_strike_rate', 'most_centuries', 'most_fifties',
    'best_bowling_average', 'most_toss_wins', 'highest_team_total', 'lowest_team_total',
    'super_over_count', 'highest_individual_score', 'fastest_fifty_tournament',
    'fastest_hundred_tournament', 'group_qualifier_live', 'top_2_after_matches',
    'playoff_qualifier', 'mvp_as_of_today',
  ]),
  groupId: z.string().optional(),
  status: z.enum(['upcoming', 'live', 'completed', 'locked']),
  startDate: z.date(),
  endDate: z.date(),
  lockTime: z.date().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  options: z.array(z.string()).optional(),
  multiSelect: z.boolean().optional(),
  maxSelections: z.number().optional(),
  rules: z.array(z.string()).optional(),
  // Event-level sponsorship
  sponsorId: z.string().optional(),
  sponsorName: z.string().optional(),
  sponsorLogo: z.string().optional(),
  sponsorWebsite: z.string().optional(),
});

const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Group name is required'),
  teams: z.array(z.string()).min(1, 'At least one team required'),
  order: z.number().default(0),
});

const tournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  format: z.enum(['T20', 'ODI', 'Test', 'IPL']),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['upcoming', 'live', 'completed']),
  teams: z.array(z.string()).min(2, 'At least 2 teams required'),
  groups: z.array(groupSchema).optional(),
  venue: z.string().optional(),
  entryFee: z.object({
    type: z.enum(['free', 'paid', 'ad_watch']),
    amount: z.number().optional(),
    tiers: z.array(z.object({ amount: z.number(), label: z.string() })).optional(),
    seasonPass: z.boolean().optional(),
  }).default({ type: 'free' }),
  entryMethod: z.enum(['free', 'paid', 'ad_watch']).optional(),
  advertisementId: z.string().optional(),
  maxParticipants: z.number().optional(),
  prizePool: z.string().optional(),
  sponsorName: z.string().optional(),
  sponsorLogo: z.string().optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  events: z.array(tournamentEventSchema).optional(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

type CricketTournamentFormProps = {
  onSubmit: (data: TournamentFormValues) => void;
  defaultValues?: Partial<TournamentFormValues>;
};

export function CricketTournamentForm({ onSubmit, defaultValues }: CricketTournamentFormProps) {
  const firestore = useFirestore();
  const [selectedEventIndices, setSelectedEventIndices] = useState<Set<number>>(new Set());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);

  // Fetch sponsors for event sponsorship
  useEffect(() => {
    const loadSponsors = async () => {
      if (!firestore) return;
      try {
        const allSponsors = await getAllImageAdSponsors(firestore);
        setSponsors(allSponsors.filter(s => s.status === 'active'));
      } catch (error) {
        console.error('Error loading sponsors:', error);
      }
    };
    loadSponsors();
  }, [firestore]);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      status: 'upcoming',
      format: 'T20',
      events: [],
      groups: [],
      teams: [],
      entryFee: { type: 'free' },
      visibility: 'public',
      ...defaultValues,
    },
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control: form.control,
    name: 'groups',
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control: form.control,
    name: 'teams' as any,
  });

  const selectedFormat = form.watch('format');
  const entryFeeType = form.watch('entryFee.type');
  const hasGroups = groupFields.length > 0;

  // Filter templates by format
  const availableTemplates = TOURNAMENT_EVENT_TEMPLATES.filter((template) => {
    if (!template.applicableFormats || template.applicableFormats.length === 0) {
      return true; // Event applies to all formats
    }
    return template.applicableFormats.includes(selectedFormat as 'T20' | 'ODI' | 'Test' | 'IPL');
  });

  // Group events by category
  const groupedEvents = React.useMemo(() => {
    const grouped: Record<string, Array<{ template: typeof TOURNAMENT_EVENT_TEMPLATES[0]; index: number }>> = {};
    availableTemplates.forEach((template, index) => {
      const category = template.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ template, index });
    });
    return grouped;
  }, [availableTemplates]);

  const addEventFromTemplate = (template: typeof TOURNAMENT_EVENT_TEMPLATES[0]) => {
    appendEvent({
      title: template.title,
      description: template.description,
      eventType: template.eventType,
      status: 'upcoming',
      startDate: new Date(),
      endDate: new Date(),
      points: template.defaultPoints,
      difficultyLevel: template.difficultyLevel,
      options: template.defaultOptions || [],
      multiSelect: template.multiSelect,
      maxSelections: template.maxSelections,
      rules: template.defaultRules || [],
    });
  };

  const handleSelectAllEvents = () => {
    if (selectedEventIndices.size === availableTemplates.length) {
      // Deselect all
      setSelectedEventIndices(new Set());
    } else {
      // Select all
      setSelectedEventIndices(new Set(availableTemplates.map((_, index) => index)));
    }
  };

  const handleToggleCategory = (category: string) => {
    const categoryEvents = groupedEvents[category] || [];
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

  const handleToggleEvent = (index: number) => {
    const newSelected = new Set(selectedEventIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEventIndices(newSelected);
  };

  const handleAddSelectedEvents = () => {
    selectedEventIndices.forEach((index) => {
      addEventFromTemplate(availableTemplates[index]);
    });
    setSelectedEventIndices(new Set());
    setIsEventDialogOpen(false);
  };

  const addGroup = () => {
    appendGroup({
      name: `Group ${String.fromCharCode(65 + groupFields.length)}`, // A, B, C, etc.
      teams: [],
      order: groupFields.length,
    });
  };

  const addTeam = () => {
    appendTeam('');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ICC Men's T20 World Cup 2024" {...field} />
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
                    <FormLabel>Format</FormLabel>
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
                      <Input placeholder="e.g., Multiple Venues" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
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
            </div>

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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tournament description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Participating Teams</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTeam}>
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder={`Team ${index + 1}`}
                  value={form.watch(`teams.${index}`)}
                  onChange={(e) => {
                    const teams = form.getValues('teams') || [];
                    teams[index] = e.target.value;
                    form.setValue('teams', teams);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTeam(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {teamFields.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No teams added. Click "Add Team" to add participating teams.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Groups (Optional)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </Button>
            </div>
            <FormDescription>
              Create groups for tournaments with group stages (e.g., Group A, Group B).
            </FormDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupFields.map((field, index) => {
              const availableTeams = form.watch('teams') || [];
              const groupTeams = form.watch(`groups.${index}.teams`) || [];
              
              return (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold">
                      {form.watch(`groups.${index}.name`) || `Group ${index + 1}`}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGroup(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`groups.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Group A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4">
                    <FormLabel>Teams in this Group</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableTeams.map((team) => {
                        const isSelected = groupTeams.includes(team);
                        return (
                          <Button
                            key={team}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => {
                              const currentTeams = form.getValues(`groups.${index}.teams`) || [];
                              if (isSelected) {
                                form.setValue(`groups.${index}.teams`, currentTeams.filter((t) => t !== team));
                              } else {
                                form.setValue(`groups.${index}.teams`, [...currentTeams, team]);
                              }
                            }}
                          >
                            {team}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
            {groupFields.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No groups added. Click "Add Group" if this tournament has group stages.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entry Fee & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <SelectItem value="ad_watch">Watch Ad to Join</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {entryFeeType === 'ad_watch' && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">
                  Users will need to view a sponsor advertisement to join this tournament for free.
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure image ads in the Image Ads section to assign them to tournaments.
                </p>
              </div>
            )}

            {entryFeeType === 'paid' && (
              <>
                <FormField
                  control={form.control}
                  name="entryFee.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 199"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Single entry fee amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Or use multiple tiers:</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentTiers = form.getValues('entryFee.tiers') || [];
                      form.setValue('entryFee.tiers', [
                        ...currentTiers,
                        { amount: 99, label: '₹99' },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </Button>
                  {form.watch('entryFee.tiers')?.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={tier.amount}
                        onChange={(e) => {
                          const tiers = form.getValues('entryFee.tiers') || [];
                          tiers[index].amount = Number(e.target.value);
                          form.setValue('entryFee.tiers', tiers);
                        }}
                      />
                      <Input
                        placeholder="Label"
                        value={tier.label}
                        onChange={(e) => {
                          const tiers = form.getValues('entryFee.tiers') || [];
                          tiers[index].label = e.target.value;
                          form.setValue('entryFee.tiers', tiers);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const tiers = form.getValues('entryFee.tiers') || [];
                          form.setValue('entryFee.tiers', tiers.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {selectedFormat === 'IPL' && (
                  <FormField
                    control={form.control}
                    name="entryFee.seasonPass"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Season Pass</FormLabel>
                          <FormDescription>
                            Allow users to buy a season pass for the entire IPL season.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 10000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'public'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="invite_only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prizePool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Pool (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹10,00,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sponsorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dream11" {...field} />
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
              <CardTitle>Tournament Events ({eventFields.length} added)</CardTitle>
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event(s)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Tournament Events from Templates</DialogTitle>
                    <DialogDescription>
                      Select one or multiple events from {availableTemplates.length} predefined tournament events.
                      {selectedEventIndices.size > 0 && (
                        <span className="block mt-1 text-primary font-semibold">
                          {selectedEventIndices.size} event(s) selected
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {Object.entries(groupedEvents).map(([category, events]) => {
                      const categoryIndices = events.map(e => e.index);
                      const allSelected = categoryIndices.length > 0 && categoryIndices.every(idx => selectedEventIndices.has(idx));
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg">{category}</h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleCategory(category)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {events.map(({ template, index }) => {
                              const isSelected = selectedEventIndices.has(index);
                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    isSelected && "bg-accent border-primary"
                                  )}
                                  onClick={() => handleToggleEvent(index)}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleEvent(index)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold">{template.title}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {template.description}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="secondary">{template.eventType}</Badge>
                                      <Badge variant="outline">{template.defaultPoints} points</Badge>
                                      {template.difficultyLevel && (
                                        <Badge variant="outline">{template.difficultyLevel}</Badge>
                                      )}
                                      {template.multiSelect && (
                                        <Badge variant="default">Multi-select</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
                        onClick={handleAddSelectedEvents}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add {selectedEventIndices.size} Event{selectedEventIndices.size !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events added yet. Click "Add Event" to add tournament events from templates.
              </div>
            )}

            {eventFields.map((field, index) => (
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
                    onClick={() => removeEvent(index)}
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

                  {hasGroups && (
                    <FormField
                      control={form.control}
                      name={`events.${index}.groupId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value === 'all-groups' ? undefined : value);
                            }} 
                            value={field.value || 'all-groups'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all-groups">All Groups</SelectItem>
                              {groupFields.map((g, idx) => {
                                const groupName = form.watch(`groups.${idx}.name`) || `Group ${idx + 1}`;
                                return (
                                  <SelectItem key={g.id} value={groupName}>
                                    {groupName}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {form.watch(`events.${index}.multiSelect`) && (
                  <FormField
                    control={form.control}
                    name={`events.${index}.maxSelections`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Selections</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 4 for semi-finalists"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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

                {/* Event Sponsor Section */}
                <div className="pt-4 border-t">
                  <h5 className="text-sm font-semibold mb-3">Event Sponsor (Optional)</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`events.${index}.sponsorId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sponsor</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              if (value === 'none') {
                                field.onChange(undefined);
                                form.setValue(`events.${index}.sponsorName`, undefined);
                                form.setValue(`events.${index}.sponsorLogo`, undefined);
                                form.setValue(`events.${index}.sponsorWebsite`, undefined);
                              } else {
                                field.onChange(value);
                                const sponsor = sponsors.find(s => s.id === value);
                                if (sponsor) {
                                  form.setValue(`events.${index}.sponsorName`, sponsor.name);
                                  form.setValue(`events.${index}.sponsorLogo`, sponsor.logoUrl || '');
                                  form.setValue(`events.${index}.sponsorWebsite`, sponsor.website || '');
                                }
                              }
                            }}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sponsor (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None (No Sponsor)</SelectItem>
                              {sponsors.map((sponsor) => (
                                <SelectItem key={sponsor.id} value={sponsor.id}>
                                  {sponsor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select a sponsor for this specific event</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch(`events.${index}.sponsorId`) && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        {form.watch(`events.${index}.sponsorLogo`) && (
                          <img 
                            src={form.watch(`events.${index}.sponsorLogo`)} 
                            alt={form.watch(`events.${index}.sponsorName`)}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{form.watch(`events.${index}.sponsorName`)}</p>
                          {form.watch(`events.${index}.sponsorWebsite`) && (
                            <p className="text-xs text-muted-foreground">Website available</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Button type="submit">
          {defaultValues ? 'Update Tournament' : 'Create Tournament'}
        </Button>
      </form>
    </Form>
  );
}

