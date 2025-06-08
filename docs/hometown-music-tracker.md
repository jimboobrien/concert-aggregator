# Hometown Music Tracker & Artist-Following Features

## Overview

This document outlines the core user-facing features for the application, which pivots from a generic data aggregator to a personalized tool for users to track their favorite venues and artists in their hometown. The goal is to create a highly personalized "what's on" feed for each user.

## Core User Stories

- **As a user, I want to...** set my hometown so the app can show me relevant local venues.
- **As a user, I want to...** browse and "follow" venues in my city that I'm interested in.
- **As a user, I want to...** see a list of all artists playing at a specific venue.
- **As a user, I want to...** "follow" specific artists to be notified when they announce a show near me.
- **As a user, I want to...** see a personalized dashboard of upcoming shows based on the venues and artists I follow.
- **As a user, I want to...** discover new artists who are playing at my favorite local venues.

## Feature Breakdown

### 1. User Profile & Personalization

The foundation of the app is the user's profile, which drives all personalization.

- **Onboarding**: New users will be prompted to select their "Hometown" (City, State/Country).
- **Profile Page**: A simple page where users can update their hometown and manage their account.
- **Database Schema (`profiles` table)**:
  - `id` (uuid, foreign key to `auth.users`)
  - `username` (text)
  - `hometown_city` (text)
  - `hometown_state` (text)
  - `created_at` (timestamp)

### 2. "My Venues" - Venue Following System

Users can curate a list of their favorite local spots.

- **Venue Discovery Page**: A searchable/browsable list of all venues currently indexed by the system, filterable by city.
- **Follow/Unfollow Button**: Every venue page will have a prominent "Follow" button.
- **"My Venues" Dashboard**: A dedicated section on the user's dashboard that lists their followed venues, perhaps with a count of upcoming shows at each.
- **Database Schema (`followed_venues` table)**:
  - `user_id` (uuid, foreign key to `profiles`)
  - `venue_id` (uuid, foreign key to `venues`)
  - `created_at` (timestamp)
  - Primary Key: `(user_id, venue_id)`

### 3. "My Artists" - Artist Following System

Users can track artists they don't want to miss.

- **Artist Discovery**: When viewing a venue's event list, each artist's name will be clickable or have a "Follow" button next to it.
- **Follow/Unfollow Logic**: Clicking "Follow" adds the artist to the user's followed list.
- **"My Artists" Dashboard**: A section on the user's dashboard listing all followed artists, perhaps with their next upcoming show date in the user's area.
- **Database Schema (`followed_artists` table)**:
  - `user_id` (uuid, foreign key to `profiles`)
  - `artist_id` (uuid, foreign key to `artists`)
  - `created_at` (timestamp)
  - Primary Key: `(user_id, artist_id)`

### 4. The Personalized "Upcoming Shows" Feed

This is the main home/dashboard view for a logged-in user. It's a dynamic feed generated based on their follows.

- **Feed Logic**: The feed will be a chronological list of `events` where:
  - `event.venue_id` is in the user's `followed_venues`.
  - **OR** `event.artist_id` is in the user's `followed_artists`.
- **UI Components**: Each item in the feed should clearly display:
  - Artist Name
  - Venue Name
  - Event Date & Time
  - A visual tag indicating *why* it's in their feed (e.g., "From Your Venues" or "From Your Artists").
  - Link to the event/ticket page.
- **Empty State**: For new users who haven't followed anything yet, the UI will guide them to discover and follow venues or artists.

### 5. Mockup / UI Concept

```
/----------------------------------------------------\\
|  BandsInTown (Your Hometown Music Tracker)         |
|----------------------------------------------------|
|  [ My Feed ]  [ Discover Venues ]  [ My Profile ]   |
|----------------------------------------------------|
|                                                    |
|  Your Upcoming Shows                               |
|  ===================                               |
|                                                    |
|  +----------------------------------------------+  |
|  | Fri, Oct 25 | The Midnight                   |  |
|  |             | at The Orange Peel [Followed]  |  |
|  +----------------------------------------------+  |
|  | Sat, Nov 2  | Khruangbin [Followed]          |  |
|  |             | at The Caverns                 |  |
|  +----------------------------------------------+  |
|  | Sat, Nov 9  | Chappell Roan                  |  |
|  |             | at The Orange Peel [Followed]  |  |
|  +----------------------------------------------+  |
|                                                    |
\\----------------------------------------------------/
```

## Future Enhancements (Post-MVP)

- **Notifications**: Email or push notifications when a followed artist announces a new show in the user's hometown.
- **Social Features**: See which friends are following the same artists or going to the same shows.
- **Music Discovery**: "If you like [Artist X], you might like [Artist Y] who is playing at [Venue Z] next month."

This new direction provides a clear, user-centric value proposition and a strong foundation for building a product people will love to use. 