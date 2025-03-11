# Productivity-Quest

A gamified productivity application that combines task management with role-playing game elements to make getting things done more engaging and rewarding.


## Table of Contents
- [Introduction](#introduction)
- [Key Features](#key-features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Project System](#project-system)
- [Gamification Elements](#gamification-elements)
- [Timer System](#timer-system)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Introduction

Productivity Quest transforms mundane task management into an engaging experience by incorporating game mechanics like XP, levels, achievements, and rewards. Tackle your to-do list while progressing through a personal development journey.


## Key Features

- **Task Management**: Create, categorize, and track tasks with customizable difficulty levels
- **Pomodoro Timer**: Built-in focus timer with short and long break options
- **Project Organization**: Group related tasks into color-coded projects with progress tracking
- **Gamification System**: Earn XP, level up, and unlock achievements and visual themes
- **Progress Tracking**: View detailed statistics about your productivity patterns
- **Streaks**: Maintain daily activity streaks for bonus rewards
- **Offline Support**: Works entirely in your browser using local storage

## Installation

### Method 1: Quick Setup with Create React App

```bash
# Create a new React application
npx create-react-app productivity-quest
cd productivity-quest

# Install required dependencies
npm install recharts lucide-react

# Replace the default files
# 1. Replace src/App.js with the Productivity Quest code
# 2. Update index.js to import App
# 3. Add necessary CSS

# Start the application
npm start
```

### Method 2: Using a Simple HTML File

For a lightweight approach without Node.js:

1. Create a folder named `productivity-quest`
2. Create an `index.html` file with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Productivity Quest</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
  <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
  <script src="https://unpkg.com/lucide-react@0.263.1"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900">
  <div id="root"></div>
  <script type="text/babel" src="app.jsx"></script>
</body>
</html>
```

3. Create an `app.jsx` file and paste the Productivity Quest code
4. Open the HTML file in your browser

![image](https://github.com/user-attachments/assets/20dc9606-78a9-4307-9f37-c8d0ee139385)


## Basic Usage

### Task Management

1. **Creating Tasks**:
   - Enter task text in the input field
   - Select category (Main, Work, Personal)
   - Choose difficulty (Easy, Medium, Hard)
   - Assign to a project (optional)
   - Click the + button

2. **Task Actions**:
   - Click the check icon to mark a task complete
   - Click the timer icon to select a task for focus time
   - Click the trash icon to delete a task

![image](https://github.com/user-attachments/assets/998b20da-9866-4451-83ff-55f78abdce38)


### Navigation

The app has three main views accessible from the top navigation:

1. **Lists**: Traditional task categories (All, Work, Personal)
2. **Projects**: Project-based organization of related tasks
3. **Stats**: Productivity metrics and achievement tracking

## Project System

Projects help organize related tasks and track progress toward larger goals.

### Project Management

1. **Creating Projects**:
   - Navigate to Projects tab
   - Click "New Project"
   - Enter name, optional description
   - Select a color
   - Click "Create Project"

2. **Working with Projects**:
   - Click on a project to view its tasks
   - Add tasks directly to the project
   - Track completion percentage
   - Monitor focus time dedicated to the project

![image](https://github.com/user-attachments/assets/b114c062-a297-4633-b0b1-f9bfe6edeed0)
![image](https://github.com/user-attachments/assets/af19d79d-6ac9-4519-84a5-53567d56ffb5)
![image](https://github.com/user-attachments/assets/44188446-2ff0-4ea7-8568-aef969656821)


## Gamification Elements

### XP and Leveling

- **Earning XP**:
  - Completing pomodoros: 20 XP base (modified by difficulty)
  - Completing tasks: 30 XP base (modified by difficulty)
  - Achievement unlocks: Various XP rewards
  - Daily streak bonuses

- **Difficulty Multipliers**:
  - Easy: 0.75× XP
  - Medium: 1× XP
  - Hard: 1.5× XP


### Achievements

Unlock special achievements by reaching milestones:

- First Step: Complete your first pomodoro
- Focus Master: Complete 10 pomodoros
- Productivity Warrior: Complete 50 pomodoros
- Task Conqueror: Complete 20 tasks
- Consistency Champion: Maintain a 5-day streak
- Pomodoro Legend: Complete 100 pomodoros
- Balance Keeper: Complete pomodoros for 7 consecutive days
- Project Manager: Create 3 projects
- Project Completer: Finish all tasks in a project

![image](https://github.com/user-attachments/assets/2f327f6c-dd1f-4661-a070-d03a2c162727)


### Rewards

- **Theme Unlocks**: New color themes at specific levels:
  - Level 3: Ocean Blue
  - Level 5: Forest Green
  - Level 7: Sunset Orange
  - Level 9: Cosmic Purple

## Timer System

The app uses the Pomodoro Technique with three timer modes:

1. **Pomodoro**: 25-minute focused work session
2. **Short Break**: 5-minute break
3. **Long Break**: 15-minute break (recommended after 4 pomodoros)

### Timer Features:

- **Task Association**: Select a task to focus on during pomodoro
- **XP Rewards**: Earn XP after completing a pomodoro
- **Streak Bonuses**: Get additional XP for consistent daily use
- **Session Tracking**: View daily and historical timer usage

![image](https://github.com/user-attachments/assets/4a6e0e11-ca02-45c1-93f2-9b013c2163ed)


## Customization

You can customize the application by modifying the code:

### XP and Leveling

At the top of the component, you'll find constants that control the gamification system:

```javascript
// Gamification Constants
const XP_PER_POMODORO = 20;
const XP_PER_TASK_COMPLETED = 30;
const XP_STREAK_BONUS = 10;
const DIFFICULTY_MULTIPLIERS = { easy: 0.75, medium: 1, hard: 1.5 };
const LEVEL_XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000];
```

### Adding Achievements

You can add new achievements by extending the `ACHIEVEMENTS` array:

```javascript
{
  id: 'your_new_achievement',
  name: 'Achievement Name',
  description: 'Achievement description',
  icon: <YourIcon size={20} />,
  condition: (stats) => stats.someValue >= requiredAmount,
  xpReward: 100
}
```

## Troubleshooting

### Data Persistence Issues

If you encounter problems with data not being saved:

1. Check browser localStorage support
2. Clear browser cache if data appears corrupted
3. Export your data periodically as backup

### Project-Task Association Issues

If tasks aren't appearing in the correct projects:

1. Ensure you're in the "Projects" view
2. Check that the task was assigned to the correct project
3. Try selecting a different project and then returning

### Performance Optimization

If the app becomes slow with many tasks/projects:

1. Complete and delete old tasks
2. Use the browser's developer tools to clear localStorage
3. Split projects into smaller, more focused ones

## Keyboard Shortcuts

- **Enter (in task input)**: Create new task
- **Esc**: Cancel current form

---

Productivity Quest is an open-source project built with React. Feel free to customize and extend it to suit your productivity needs!
