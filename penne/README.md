# Penne

A dining hall rating application for the University of Pennsylvania, similar to Beli but specifically for Penn's dining halls. Built with React Native and Supabase.

## Overview

Penne allows Penn students to rate dining halls, comment on specific menu items, and see what others think about the food options on campus. The app features user authentication, real-time ratings, and social features.

## Features

- **User Authentication**: Secure login and account management
- **Home Screen**: Choose dining halls, rate menu items scraped from the school website, and give overall dining hall ratings
- **Feed Screen**: View and interact with other users' ratings and comments
- **Leaderboard**: See the top-rated dining halls by day, week, and month
- **Profile**: View personal ratings history and manage account settings

## Tech Stack

- React Native
- Expo
- TypeScript
- Supabase (PostgreSQL)
- React Navigation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Xcode (for iOS development)
- Expo CLI

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd penne
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open the iOS simulator to run the app:
   - Press `i` in the terminal where Expo is running, or
   - Use the Expo Go app on a physical device
   - You might need to run:
   ```
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

## Database Setup

The app uses Supabase for the backend.

## Project Structure

- `/screens`: Main app screens (Home, Feed, Leaderboard, Profile)
- `/components`: Reusable UI components
- `/lib`: Utility functions and API integrations
- `/assets`: Images, fonts, and other static assets
- `/scraper`: Tools for scraping Penn's dining hall menu data

## Development

- **Running on iOS**: `npm run ios`
- **Running on Android**: `npm run android`