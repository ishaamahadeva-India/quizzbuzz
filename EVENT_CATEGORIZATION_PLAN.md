# Event Categorization and Bulk Selection Plan

## Movie Events - Categories:
1. **Pre-Release Events** - Poster, teaser, trailer, first look, title announcement, social media buzz
2. **Release Day Events** - Opening day collection, occupancy, shows, regional performance
3. **First Weekend Events** - Weekend collection, growth, footfalls
4. **First Week Events** - Week collection, average occupancy, weekday vs weekend
5. **Ratings & Reviews** - IMDb, Rotten Tomatoes, critics, audience ratings
6. **Social Media & Buzz** - Twitter mentions, Instagram posts, YouTube trends, hashtags
7. **Music & Soundtrack** - Song views, streaming milestones, soundtrack performance
8. **OTT & Streaming** - OTT platform, release date gap, viewing hours
9. **Lifetime & Legacy** - Lifetime gross, 100/200 crore club, theatrical run duration
10. **Regional & Overseas** - Regional leaders, USA, UAE collections

## Multiple Movies Comparison Events - Need More:
Currently ~20 comparison events. Need to add:
- More pre-release comparisons
- More opening day comparisons  
- More weekend/week comparisons
- More lifetime comparisons
- More social media comparisons

## Cricket Events - Categories:
1. **Powerplay Events** - Runs, wickets, boundaries, sixes, dot balls
2. **Batting Events** - First ball, boundaries, partnerships, milestones, scores
3. **Bowling Events** - Wickets, economy, maidens, hauls, dismissals
4. **Fielding Events** - Catches, run outs, errors
5. **Match Outcome** - Toss, winner, margin, total runs/wickets
6. **Innings Events** - First/second innings scores and wickets
7. **Special Events** - Hat-tricks, super overs, DRS, free hits
8. **Player Performance** - Man of match, top scorer, top wicket taker

## Cricket Events Clarification:
- **CRICKET_EVENT_TEMPLATES** = For **LIVE MATCHES** (single match predictions)
- **TOURNAMENT_EVENT_TEMPLATES** = For **TOURNAMENTS** (multi-match predictions like IPL, World Cup)

## Implementation Steps:
1. Add category field to all event templates
2. Group events by category in UI
3. Add checkboxes for bulk selection
4. Add "Select All in Category" buttons
5. Add more comparison events for multiple movies

