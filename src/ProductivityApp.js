import React, { useState, useEffect } from 'react';
import { Bell, Play, Pause, RotateCcw, Check, Trash2, Plus, List, Clock, BarChart, Timer, Award, Star, Gift, Zap, Flame, Shield, Trophy, Heart, FolderPlus, Folder, Edit, X, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Gamification Constants
const XP_PER_POMODORO = 20;
const XP_PER_TASK_COMPLETED = 30;
const XP_STREAK_BONUS = 10; // per day in streak
const DIFFICULTY_MULTIPLIERS = { easy: 0.75, medium: 1, hard: 1.5 };
const LEVEL_XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000]; // XP needed for each level
const THEME_REWARDS = {
3: { name: "Ocean Blue", colors: { primary: "#3b82f6", secondary: "#1e40af", bg: "#0f172a" } },
5: { name: "Forest Green", colors: { primary: "#22c55e", secondary: "#15803d", bg: "#14261d" } },
7: { name: "Sunset Orange", colors: { primary: "#f97316", secondary: "#c2410c", bg: "#271c13" } },
9: { name: "Cosmic Purple", colors: { primary: "#a855f7", secondary: "#7e22ce", bg: "#1f1433" } }
};
const playAlarm = () => {
  // In a real implementation, you'd play a sound here
  alert('Pomodoro completed! XP gained!');
};
// Project Colors
const PROJECT_COLORS = [
"#3b82f6", // Blue
"#22c55e", // Green
"#f97316", // Orange
"#a855f7", // Purple
"#ec4899", // Pink
"#facc15", // Yellow
"#14b8a6", // Teal
"#f43f5e", // Red
"#8b5cf6", // Indigo
"#6366f1"  // Violet
];

// Achievement definitions
const ACHIEVEMENTS = [
{
  id: 'first_pomodoro',
  name: 'First Step',
  description: 'Complete your first pomodoro',
  icon: <Zap size={20} />,
  condition: (stats) => stats.totalPomodoros >= 1,
  xpReward: 25
},
{
  id: 'focus_master',
  name: 'Focus Master',
  description: 'Complete 10 pomodoros',
  icon: <Flame size={20} />,
  condition: (stats) => stats.totalPomodoros >= 10,
  xpReward: 100
},
{
  id: 'productivity_warrior',
  name: 'Productivity Warrior',
  description: 'Complete 50 pomodoros',
  icon: <Shield size={20} />,
  condition: (stats) => stats.totalPomodoros >= 50,
  xpReward: 300
},
{
  id: 'task_conqueror',
  name: 'Task Conqueror',
  description: 'Complete 20 tasks',
  icon: <Trophy size={20} />,
  condition: (stats) => stats.completedTasks >= 20,
  xpReward: 150
},
{
  id: 'consistency_champion',
  name: 'Consistency Champion',
  description: 'Maintain a 5-day streak',
  icon: <Award size={20} />,
  condition: (stats) => stats.currentStreak >= 5,
  xpReward: 200
},
{
  id: 'pomodoro_legend',
  name: 'Pomodoro Legend',
  description: 'Complete 100 pomodoros',
  icon: <Star size={20} />,
  condition: (stats) => stats.totalPomodoros >= 100,
  xpReward: 500
},
{
  id: 'balance_keeper',
  name: 'Balance Keeper',
  description: 'Complete at least one pomodoro for 7 consecutive days',
  icon: <Heart size={20} />,
  condition: (stats) => stats.currentStreak >= 7,
  xpReward: 300
},
{
  id: 'project_manager',
  name: 'Project Manager',
  description: 'Create 3 projects',
  icon: <Folder size={20} />,
  condition: (stats, projects) => projects?.length >= 3,
  xpReward: 150
},
{
  id: 'project_completer',
  name: 'Project Completer',
  description: 'Complete all tasks in a project',
  icon: <FolderPlus size={20} />,
  condition: (stats, projects) => projects?.some(p => 
    p.tasks.length > 0 && p.tasks.every(taskId => (stats.completedTaskIds || []).includes(taskId))
  ),
  xpReward: 250
}
];

const ProductivityApp = () => {
// To-Do List State
const [tasks, setTasks] = useState([]);
const [newTaskText, setNewTaskText] = useState('');
const [activeList, setActiveList] = useState('all');
const [newTaskList, setNewTaskList] = useState('main');
const [taskDifficulty, setTaskDifficulty] = useState('medium');

// Project State
const [projects, setProjects] = useState([]);
const [activeProject, setActiveProject] = useState(null);
const [showProjectForm, setShowProjectForm] = useState(false);
const [newProjectName, setNewProjectName] = useState('');
const [newProjectDescription, setNewProjectDescription] = useState('');
const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
const [editingProject, setEditingProject] = useState(null);
const [activeView, setActiveView] = useState('tasks'); // 'tasks', 'projects', 'stats'

// Pomodoro Timer State
const [minutes, setMinutes] = useState(25);
const [seconds, setSeconds] = useState(0);
const [isActive, setIsActive] = useState(false);
const [timerMode, setTimerMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
const [selectedTaskId, setSelectedTaskId] = useState(null);

// Pomodoro History State
const [pomodoroHistory, setPomodoroHistory] = useState([]);
const [showStatsView, setShowStatsView] = useState(false);

// Gamification State
const [userStats, setUserStats] = useState({
  xp: 0,
  level: 1,
  totalPomodoros: 0,
  completedTasks: 0,
  completedTaskIds: [],
  lastActive: null,
  currentStreak: 0,
  longestStreak: 0,
  unlockedThemes: [{ name: "Default Dark", colors: { primary: "#6366f1", secondary: "#4f46e5", bg: "#111827" } }],
  activeTheme: "Default Dark",
  achievements: [],
  nextLevelXp: 100
});

const [showLevelUp, setShowLevelUp] = useState(false);
const [newAchievements, setNewAchievements] = useState([]);
const [showAchievement, setShowAchievement] = useState(false);
const [showRewards, setShowRewards] = useState(false);

// Load data from localStorage on component mount
useEffect(() => {
  const savedTasks = localStorage.getItem('tasks');
  if (savedTasks) {
    try {
      setTasks(JSON.parse(savedTasks));
    } catch (e) {
      console.error("Error parsing saved tasks:", e);
      setTasks([]);
    }
  }
  
  const savedProjects = localStorage.getItem('projects');
  if (savedProjects) {
    try {
      setProjects(JSON.parse(savedProjects));
    } catch (e) {
      console.error("Error parsing saved projects:", e);
      setProjects([]);
    }
  }
  
  const savedPomodoroHistory = localStorage.getItem('pomodoroHistory');
  if (savedPomodoroHistory) {
    try {
      setPomodoroHistory(JSON.parse(savedPomodoroHistory));
    } catch (e) {
      console.error("Error parsing pomodoro history:", e);
      setPomodoroHistory([]);
    }
  }
  
  const savedUserStats = localStorage.getItem('userStats');
  if (savedUserStats) {
    try {
      setUserStats(JSON.parse(savedUserStats));
    } catch (e) {
      console.error("Error parsing user stats:", e);
    }
  }
  
  // Check streak on app load
  updateStreak();
}, []);

// Save data to localStorage when it changes
useEffect(() => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}, [tasks]);

useEffect(() => {
  localStorage.setItem('projects', JSON.stringify(projects));
}, [projects]);

useEffect(() => {
  localStorage.setItem('pomodoroHistory', JSON.stringify(pomodoroHistory));
}, [pomodoroHistory]);

useEffect(() => {
  localStorage.setItem('userStats', JSON.stringify(userStats));
  
  // Check for new achievements
  checkAchievements();
  
}, [userStats]);

// Timer logic
useEffect(() => {
  let interval = null;
  
  if (isActive) {
    interval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else if (minutes > 0) {
        setMinutes(minutes - 1);
        setSeconds(59);
      } else {
        // Timer finished
        clearInterval(interval);
        setIsActive(false);
        
        // If it was a pomodoro, record it in history and award XP
        if (timerMode === 'pomodoro') {
          const now = new Date();
          const todayFormatted = now.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          const selectedTask = tasks.find(t => t.id === selectedTaskId);
          const selectedProjectId = selectedTask?.projectId;
          const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
          
          const newPomodoro = {
            date: now.toISOString(),
            dateFormatted: todayFormatted,
            taskId: selectedTaskId,
            taskName: selectedTask?.text || 'Unassigned',
            projectId: selectedProjectId || null,
            projectName: selectedProject?.name || null,
            duration: 25, // Standard pomodoro is 25 minutes
            difficulty: selectedTask?.difficulty || 'medium'
          };
          
          setPomodoroHistory(prevHistory => [...prevHistory, newPomodoro]);
          
          // Calculate XP gain based on difficulty
          const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[newPomodoro.difficulty] || 1;
          const baseXP = XP_PER_POMODORO;
          const streakBonus = Math.min(userStats.currentStreak * XP_STREAK_BONUS, XP_PER_POMODORO); // Cap the streak bonus
          const totalXP = Math.round((baseXP + streakBonus) * difficultyMultiplier);
          
          // Update user stats
          setUserStats(prev => {
            const newTotalPomodoros = prev.totalPomodoros + 1;
            const newXP = prev.xp + totalXP;
            
            // Calculate new level based on new XP
            const newLevel = calculateLevel(newXP);
            const showLevel = newLevel > prev.level;
            
            // Check if a new theme should be unlocked
            let unlockedThemes = [...prev.unlockedThemes];
            if (THEME_REWARDS[newLevel] && !prev.unlockedThemes.find(t => t.name === THEME_REWARDS[newLevel].name)) {
              unlockedThemes.push(THEME_REWARDS[newLevel]);
              setShowRewards(true);
            }
            
            // Determine next level XP requirement
            const nextLevelXp = getNextLevelXp(newLevel);
            
            if (showLevel) {
              setShowLevelUp(true);
              setTimeout(() => setShowLevelUp(false), 3000);
            }
            
            return {
              ...prev,
              xp: newXP,
              level: newLevel,
              totalPomodoros: newTotalPomodoros,
              lastActive: new Date().toISOString(),
              unlockedThemes,
              nextLevelXp
            };
          });
          
          // If there was a task associated, update its pomodoro count
          if (selectedTaskId) {
            setTasks(prevTasks => 
              prevTasks.map(task => 
                task.id === selectedTaskId 
                  ? { ...task, pomodoroCount: (task.pomodoroCount || 0) + 1 } 
                  : task
              )
            );
            
            // If the task belongs to a project, update the project's pomodoro count
            if (selectedProjectId) {
              setProjects(prevProjects => 
                prevProjects.map(project => 
                  project.id === selectedProjectId
                    ? { ...project, pomodoroCount: (project.pomodoroCount || 0) + 1 }
                    : project
                )
              );
            }
          }
          
          // Update streak
          updateStreak();
        }
        
        playAlarm();
      }
    }, 1000);
  } else {
    clearInterval(interval);
  }
  
  return () => clearInterval(interval);
}, [isActive, minutes, seconds, timerMode, selectedTaskId, tasks, userStats, projects]);

// Handle level up notification dismissal
useEffect(() => {
  if (showLevelUp) {
    const timer = setTimeout(() => setShowLevelUp(false), 3000);
    return () => clearTimeout(timer);
  }
}, [showLevelUp]);

// Handle achievement notification dismissal
useEffect(() => {
  if (showAchievement && newAchievements.length > 0) {
    const timer = setTimeout(() => {
      setShowAchievement(false);
      setNewAchievements([]);
    }, 4000);
    return () => clearTimeout(timer);
  }
}, [showAchievement, newAchievements]);

// Check for achievement unlocks
const checkAchievements = () => {
  const unlockedAchievements = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    // Skip already unlocked achievements
    if (userStats.achievements.includes(achievement.id)) return;
    
    // Check if achievement condition is met
    if (achievement.condition(userStats, projects)) {
      unlockedAchievements.push(achievement);
    }
  });
  
  if (unlockedAchievements.length > 0) {
    // Add achievements to user stats
    setUserStats(prev => {
      const newAchievements = [...prev.achievements];
      let additionalXP = 0;
      
      unlockedAchievements.forEach(achievement => {
        if (!newAchievements.includes(achievement.id)) {
          newAchievements.push(achievement.id);
          additionalXP += achievement.xpReward;
        }
      });
      
      return {
        ...prev,
        achievements: newAchievements,
        xp: prev.xp + additionalXP
      };
    });
    
    // Show achievement notification
    setNewAchievements(unlockedAchievements);
    setShowAchievement(true);
  }
};

// Update user streak
const updateStreak = () => {
  const today = new Date().toISOString().split('T')[0];
  
  setUserStats(prev => {
    if (!prev.lastActive) {
      // First time using the app
      return { ...prev, lastActive: today, currentStreak: 1, longestStreak: 1 };
    }
    
    const lastActiveDate = new Date(prev.lastActive).toISOString().split('T')[0];
    
    // If already active today, no change
    if (lastActiveDate === today) return prev;
    
    // Check if last active was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    if (lastActiveDate === yesterdayFormatted) {
      // Continuing the streak
      const newStreak = prev.currentStreak + 1;
      return {
        ...prev,
        lastActive: today,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak)
      };
    } else {
      // Streak broken, starting new streak
      return {
        ...prev,
        lastActive: today,
        currentStreak: 1
      };
    }
  });
};

// Update level based on XP (separate function for clarity)
const calculateLevel = (xp) => {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_REQUIREMENTS.length; i++) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

// Calculate next level XP requirement
const getNextLevelXp = (level) => {
  if (level < LEVEL_XP_REQUIREMENTS.length) {
    return LEVEL_XP_REQUIREMENTS[level];
  } else {
    return LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1] + 
           (1000 * (level - LEVEL_XP_REQUIREMENTS.length + 1));
  }
};

// Timer Controls
const startTimer = () => setIsActive(true);
const pauseTimer = () => setIsActive(false);
const resetTimer = () => {
  setIsActive(false);
  if (timerMode === 'pomodoro') {
    setMinutes(25);
  } else if (timerMode === 'shortBreak') {
    setMinutes(5);
  } else {
    setMinutes(15);
  }
  setSeconds(0);
};

const changeTimerMode = (mode) => {
  setTimerMode(mode);
  setIsActive(false);
  
  if (mode === 'pomodoro') {
    setMinutes(25);
  } else if (mode === 'shortBreak') {
    setMinutes(5);
  } else {
    setMinutes(15);
  }
  setSeconds(0);
};

// Project Management
const handleAddProject = () => {
  if (newProjectName.trim() === '') return;
  
  const projectId = editingProject?.id || String(Date.now());
  
  const projectToAdd = {
    id: projectId,
    name: newProjectName,
    description: newProjectDescription,
    color: newProjectColor,
    createdAt: editingProject?.createdAt || new Date().toISOString(),
    tasks: editingProject?.tasks || [],
    completedTasks: editingProject?.completedTasks || 0,
    pomodoroCount: editingProject?.pomodoroCount || 0
  };
  
  if (editingProject) {
    // Update existing project
    setProjects(prevProjects => 
      prevProjects.map(project => 
        String(project.id) === String(editingProject.id) ? projectToAdd : project
      )
    );
  } else {
    // Add new project
    setProjects(prevProjects => [...prevProjects, projectToAdd]);
    
    // Auto-select the newly created project
    setActiveProject(projectId);
  }
  
  // Reset form
  setNewProjectName('');
  setNewProjectDescription('');
  setNewProjectColor(PROJECT_COLORS[0]);
  setShowProjectForm(false);
  setEditingProject(null);
  
  console.log(`Project created/updated: ${projectId}`);
};

const handleEditProject = (project) => {
  setEditingProject(project);
  setNewProjectName(project.name);
  setNewProjectDescription(project.description || '');
  setNewProjectColor(project.color);
  setShowProjectForm(true);
};

const handleDeleteProject = (projectId) => {
  // Remove project from tasks
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.projectId === projectId ? { ...task, projectId: null } : task
    )
  );
  
  // Remove project
  setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
  
  // If active project is deleted, set to null
  if (activeProject === projectId) {
    setActiveProject(null);
  }
};

// When user selects a project from projects view
const selectProject = (projectId) => {
  // Ensure project ID is consistent by converting to string
  const stringProjectId = String(projectId);
  console.log(`Selecting project: ${stringProjectId}`);
  setActiveProject(stringProjectId);
  setActiveView('projects');
};

// Task Management
const handleAddTask = () => {
  if (newTaskText.trim() === '') return;
  
  const taskId = Date.now();
  
  // Ensure project ID is a string for consistent comparison
  const projectId = activeProject ? String(activeProject) : null;
  
  const newTask = {
    id: taskId,
    text: newTaskText,
    completed: false,
    list: newTaskList,
    projectId: projectId,
    pomodoroCount: 0,
    difficulty: taskDifficulty,
    createdAt: new Date().toISOString()
  };
  
  console.log(`Creating task: ${newTask.text} with project ID: ${projectId}`);
  
  setTasks(prevTasks => [...prevTasks, newTask]);
  
  // If task is added to a project, update the project's task list
  if (projectId) {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        // Convert to string for consistent comparison
        if (String(project.id) === projectId) {
          console.log(`Adding task ${taskId} to project ${project.name} (ID: ${project.id})`);
          return { 
            ...project, 
            tasks: [...(project.tasks || []), taskId] 
          };
        }
        return project;
      })
    );
  }
  
  setNewTaskText('');
};

const toggleTaskCompletion = (taskId) => {
  const taskToToggle = tasks.find(task => task.id === taskId);
  const wasCompleted = taskToToggle?.completed;
  
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
  );
  
  // If task is being completed, award XP
  if (!wasCompleted) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[task.difficulty] || 1;
      const xpGain = Math.round(XP_PER_TASK_COMPLETED * difficultyMultiplier);
      
      // Update user stats with new XP and check for level up
      setUserStats(prev => {
        const newXP = prev.xp + xpGain;
        const newLevel = calculateLevel(newXP);
        const showLevel = newLevel > prev.level;
        
        // Determine next level XP requirement
        const nextLevelXp = getNextLevelXp(newLevel);
        
        if (showLevel) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }
        
        return {
          ...prev,
          xp: newXP,
          level: newLevel,
          nextLevelXp,
          completedTasks: prev.completedTasks + 1,
          completedTaskIds: [...(prev.completedTaskIds || []), taskId]
        };
      });
      
      // If task belongs to a project, update the project's completed task count
      if (task.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === task.projectId 
              ? { ...project, completedTasks: project.completedTasks + 1 } 
              : project
          )
        );
      }
    }
  } else {
    // If task is being uncompleted, update stats
    setUserStats(prev => ({
      ...prev,
      completedTasks: Math.max(0, prev.completedTasks - 1),
      completedTaskIds: (prev.completedTaskIds || []).filter(id => id !== taskId)
    }));
    
    // If task belongs to a project, update the project's completed task count
    if (taskToToggle.projectId) {
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === taskToToggle.projectId 
            ? { ...project, completedTasks: Math.max(0, project.completedTasks - 1) } 
            : project
        )
      );
    }
  }
  
  // If the completed task was selected, deselect it
  if (selectedTaskId === taskId) {
    setSelectedTaskId(null);
  }
};

const deleteTask = (taskId) => {
  const taskToDelete = tasks.find(task => task.id === taskId);
  
  // If the deleted task was selected, deselect it
  if (selectedTaskId === taskId) {
    setSelectedTaskId(null);
  }
  
  // If task belongs to a project, remove it from the project's task list
  if (taskToDelete?.projectId) {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === taskToDelete.projectId 
          ? { 
              ...project, 
              tasks: project.tasks.filter(id => id !== taskId),
              completedTasks: taskToDelete.completed 
                ? Math.max(0, project.completedTasks - 1) 
                : project.completedTasks
            } 
          : project
      )
    );
  }
  
  setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
};

const selectTaskForPomodoro = (taskId) => {
  setSelectedTaskId(taskId);
  
  // Automatically set to pomodoro mode and reset timer
  changeTimerMode('pomodoro');
};

// Filter tasks based on active view and selection
const getFilteredTasks = () => {
  let filteredTasks = [...tasks];
  
  // Filter by project if in project view and a project is selected
  if (activeView === 'projects' && activeProject) {
    filteredTasks = filteredTasks.filter(task => 
      String(task.projectId) === String(activeProject)
    );
  } 
  // Filter by list category if in tasks view
  else if (activeView === 'tasks' && activeList !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.list === activeList);
  }
  
  return filteredTasks;
};

const filteredTasks = getFilteredTasks();
const completedTasks = filteredTasks.filter(task => task.completed);
const activeTasks = filteredTasks.filter(task => !task.completed);

// Theme Management
const setActiveTheme = (themeName) => {
  const theme = userStats.unlockedThemes.find(t => t.name === themeName);
  if (theme) {
    setUserStats(prev => ({
      ...prev,
      activeTheme: themeName
    }));
    setShowRewards(false);
  }
};

// Get active theme colors
const getThemeColors = () => {
  const theme = userStats.unlockedThemes.find(t => t.name === userStats.activeTheme);
  return theme ? theme.colors : { primary: "#6366f1", secondary: "#4f46e5", bg: "#111827" };
};

const themeColors = getThemeColors();

// Calculate project progress percentage
const calculateProjectProgress = (project) => {
  const totalTasks = project.tasks.length;
  if (totalTasks === 0) return 0;
  return Math.round((project.completedTasks / totalTasks) * 100);
};

// Data processing for the pomodoro history chart
const prepareChartData = () => {
  // Group by date
  const groupedByDate = {};
  
  pomodoroHistory.forEach(pomodoro => {
    const date = pomodoro.dateFormatted;
    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        date,
        totalMinutes: 0,
        count: 0
      };
    }
    
    groupedByDate[date].totalMinutes += pomodoro.duration;
    groupedByDate[date].count += 1;
  });
  
  // Convert to array and sort by date
  return Object.values(groupedByDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7); // Only show the last 7 days
};

// Calculate level progress percentage
const calculateLevelProgress = () => {
  const currentLevelXp = LEVEL_XP_REQUIREMENTS[userStats.level - 1] || 0;
  const nextLevelXp = userStats.nextLevelXp;
  const xpInCurrentLevel = userStats.xp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  
  return Math.min(Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100), 100);
};

// Get the selected task if any
const selectedTask = selectedTaskId 
  ? tasks.find(task => String(task.id) === String(selectedTaskId)) 
  : null;

// Get the active project if any
const selectedProject = activeProject
  ? projects.find(project => String(project.id) === String(activeProject))
  : null;

return (
  <div className="flex flex-col min-h-screen" style={{ backgroundColor: themeColors.bg }}>
    {/* Header */}
    <header className="bg-gray-800 py-4 px-6 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Productivity Quest</h1>
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm text-gray-400">Level {userStats.level}</p>
            <div className="w-36 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${calculateLevelProgress()}%`,
                  backgroundColor: themeColors.primary
                }}
              ></div>
            </div>
          </div>
          <button 
            onClick={() => setShowRewards(!showRewards)} 
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-yellow-400"
            title="Rewards and Themes"
          >
            <Gift size={20} />
          </button>
        </div>
      </div>
    </header>
    
    {/* Rewards Panel */}
    {showRewards && (
      <div className="bg-gray-800 shadow-lg p-4 border-t border-gray-700">
        <h3 className="font-bold text-lg text-white mb-3">Themes & Rewards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {userStats.unlockedThemes.map(theme => (
            <div 
              key={theme.name}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                userStats.activeTheme === theme.name 
                  ? 'ring-2 ring-offset-2 ring-offset-gray-800' 
                  : 'hover:bg-gray-700'
              }`}
              style={{ 
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.primary,
                ringColor: theme.colors.primary
              }}
              onClick={() => setActiveTheme(theme.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">{theme.name}</p>
                {userStats.activeTheme === theme.name && (
                  <Check size={16} className="text-green-400" />
                )}
              </div>
              <div className="flex space-x-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium text-gray-300 mb-2">Upcoming Rewards</h4>
          <ul className="space-y-2">
            {Object.entries(THEME_REWARDS)
              .filter(([level]) => parseInt(level) > userStats.level)
              .slice(0, 3)
              .map(([level, theme]) => (
                <li key={level} className="bg-gray-700 p-2 rounded flex items-center space-x-3">
                  <div className="p-1 rounded" style={{ backgroundColor: theme.colors.bg }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                  </div>
                  <span className="text-gray-300">{theme.name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded ml-auto">Level {level}</span>
                </li>
              ))}
          </ul>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium text-gray-300 mb-2">Achievements</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ACHIEVEMENTS.map(achievement => {
              const isUnlocked = userStats.achievements.includes(achievement.id);
              return (
                <div 
                  key={achievement.id}
                  className={`p-2 rounded flex items-center space-x-2 ${
                    isUnlocked ? 'bg-gray-700' : 'bg-gray-800 opacity-50'
                  }`}
                >
                  <div className={`p-1 rounded-full ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">
                      {achievement.name}
                      <span className="text-xs text-gray-400 ml-1">+{achievement.xpReward}XP</span>
                    </p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    
    {/* Level Up Notification */}
    {showLevelUp && (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900 font-bold px-4 py-2 rounded-full shadow-lg z-50 flex items-center space-x-2">
        <Award size={20} />
        <span>Level Up! You reached Level {userStats.level}!</span>
      </div>
    )}
    
    {/* Achievement Notification */}
    {showAchievement && newAchievements.length > 0 && (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50 max-w-xs border-l-4 border-yellow-500">
        <div className="flex items-center mb-2">
          <Trophy size={18} className="text-yellow-500 mr-2" />
          <p className="font-bold">Achievement Unlocked!</p>
        </div>
        {newAchievements.map(achievement => (
          <div key={achievement.id} className="mb-1 last:mb-0">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-xs text-gray-400">{achievement.description}</p>
            <p className="text-xs text-yellow-500">+{achievement.xpReward} XP</p>
          </div>
        ))}
      </div>
    )}
    
    <main className="flex flex-col md:flex-row flex-1 p-6 gap-6">
      {/* Left Column: Tasks & Projects */}
      <div className="w-full md:w-1/2 lg:w-2/3 bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Main Nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              className={`flex items-center py-1 px-3 rounded-md ${activeView === 'tasks' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={activeView === 'tasks' ? { backgroundColor: themeColors.primary } : {}}
              onClick={() => {
                setActiveView('tasks');
                setActiveProject(null);
              }}
            >
              <List size={18} className="mr-1" />
              <span>Lists</span>
            </button>
            <button
              className={`flex items-center py-1 px-3 rounded-md ${activeView === 'projects' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={activeView === 'projects' ? { backgroundColor: themeColors.primary } : {}}
              onClick={() => setActiveView('projects')}
            >
              <Folder size={18} className="mr-1" />
              <span>Projects</span>
            </button>
            <button
              className={`flex items-center py-1 px-3 rounded-md ${activeView === 'stats' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={activeView === 'stats' ? { backgroundColor: themeColors.primary } : {}}
              onClick={() => setActiveView('stats')}
            >
              <BarChart size={18} className="mr-1" />
              <span>Stats</span>
            </button>
          </div>
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">{userStats.currentStreak}</span> day streak
          </div>
        </div>
        
        {/* View Content */}
        {activeView === 'stats' && (
          // Stats View
          <div className="mb-6">
            <h3 className="font-bold mb-4 text-lg text-white">Your Focus Time (Last 7 Days)</h3>
            
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <div className="h-64">
                {pomodoroHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={prepareChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#aaa"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }} 
                      />
                      <YAxis 
                        stroke="#aaa" 
                        label={{ 
                          value: 'Minutes', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: '#aaa' } 
                        }} 
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} minutes`, 'Focus Time']}
                        labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                        contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '4px' }}
                      />
                      <Bar 
                        dataKey="totalMinutes" 
                        fill={themeColors.primary}
                        radius={[4, 4, 0, 0]} 
                        name="Focus Time"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No focus sessions recorded yet. Complete a pomodoro to see your stats!</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <h4 className="text-gray-400 mb-1">Total Focus Time</h4>
                <p className="text-2xl font-bold text-white">
                  {pomodoroHistory.reduce((total, p) => total + p.duration, 0)} mins
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <h4 className="text-gray-400 mb-1">Pomodoros Completed</h4>
                <p className="text-2xl font-bold text-white">{pomodoroHistory.length}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <h4 className="text-gray-400 mb-1">Current Streak</h4>
                <p className="text-2xl font-bold text-white">
                  {userStats.currentStreak} days
                </p>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Your Progress</h4>
              <div className="flex items-center space-x-2 mb-1">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-gray-300">Total XP:</span>
                <span className="font-medium text-white">{userStats.xp} XP</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <Award size={16} className="text-yellow-400" />
                <span className="text-gray-300">Current Level:</span>
                <span className="font-medium text-white">{userStats.level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-gray-300">Achievements:</span>
                <span className="font-medium text-white">{userStats.achievements.length} / {ACHIEVEMENTS.length}</span>
              </div>
            </div>
            
            {projects.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-2 text-lg text-white">Project Stats</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    {projects.map(project => {
                      const progress = calculateProjectProgress(project);
                      return (
                        <div key={project.id} className="bg-gray-800 p-3 rounded-md">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium text-white">{project.name}</h4>
                            <span 
                              className="text-xs rounded-full px-2 py-0.5" 
                              style={{ backgroundColor: project.color + '40', color: project.color }}
                            >
                              {progress}% Complete
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full mb-2">
                            <div 
                              className="h-full rounded-full" 
                              style={{ width: `${progress}%`, backgroundColor: project.color }}
                            ></div>
                          </div>
                          <div className="grid grid-cols-2 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              <span>{project.pomodoroCount || 0} pomodoros</span>
                            </div>
                            <div className="flex items-center">
                              <Check size={14} className="mr-1" />
                              <span>{project.completedTasks || 0}/{project.tasks.length} tasks</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeView === 'projects' && (
          // Projects View
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">
                {selectedProject ? selectedProject.name : 'Projects'}
              </h3>
              <button
                onClick={() => {
                  setShowProjectForm(true);
                  setEditingProject(null);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setNewProjectColor(PROJECT_COLORS[0]);
                }}
                className="flex items-center text-white px-3 py-1 rounded-md hover:bg-gray-700"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FolderPlus size={16} className="mr-1" />
                <span>New Project</span>
              </button>
            </div>
            
            {/* Project Form */}
            {showProjectForm && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-white">{editingProject ? 'Edit Project' : 'New Project'}</h4>
                  <button 
                    onClick={() => setShowProjectForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter project name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the project..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Project Color</label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewProjectColor(color)}
                          className={`w-6 h-6 rounded-full ${newProjectColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-700' : ''}`}
                          style={{ backgroundColor: color, ringColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowProjectForm(false)}
                      className="px-3 py-1 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddProject}
                      className="px-3 py-1 text-white rounded-md hover:bg-opacity-90"
                      style={{ backgroundColor: themeColors.primary }}
                      disabled={!newProjectName.trim()}
                    >
                      {editingProject ? 'Update Project' : 'Create Project'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Project List or Selected Project */}
            {!selectedProject ? (
              // Project List
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.length === 0 ? (
                  <div className="col-span-2 bg-gray-700 p-6 rounded-lg text-center text-gray-400">
                    <FolderPlus size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No projects yet. Create your first project to get started!</p>
                    <button
                      onClick={() => {
                        setShowProjectForm(true);
                        setEditingProject(null);
                      }}
                      className="mt-3 px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      Create Project
                    </button>
                  </div>
                ) : (
                  projects.map(project => {
                    const progress = calculateProjectProgress(project);
                    const projectTasks = tasks.filter(task => task.projectId === project.id);
                    const activeTasks = projectTasks.filter(task => !task.completed);
                    
                    return (
                      <div 
                        key={project.id} 
                        className="bg-gray-700 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => selectProject(project.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: project.color }}
                            ></div>
                            <h4 className="font-medium text-white">{project.name}</h4>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project);
                              }}
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete project "${project.name}"?`)) {
                                  handleDeleteProject(project.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded ml-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-gray-400 mt-1 mb-2">{project.description}</p>
                        )}
                        
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-800 rounded-full">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ width: `${progress}%`, backgroundColor: project.color }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-3 text-sm">
                          <div className="text-gray-400">
                            <span className="text-white font-medium">{activeTasks.length}</span> active tasks
                          </div>
                          <div className="text-gray-400">
                            <span className="text-white font-medium">{project.pomodoroCount || 0}</span> pomodoros
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Selected Project View
              <div>
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: selectedProject.color }}
                        ></div>
                        <h3 className="font-medium text-lg text-white">{selectedProject.name}</h3>
                      </div>
                      {selectedProject.description && (
                        <p className="text-sm text-gray-400 mt-1">{selectedProject.description}</p>
                      )}
                    </div>
                    <div className="flex items-start">
                      <button
                        onClick={() => handleEditProject(selectedProject)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded mr-1"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setActiveProject(null)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="bg-gray-800 p-2 rounded text-center">
                      <p className="text-xs text-gray-400">Tasks</p>
                      <p className="text-lg font-medium text-white">{selectedProject.tasks.length}</p>
                    </div>
                    <div className="bg-gray-800 p-2 rounded text-center">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-lg font-medium text-white">{selectedProject.completedTasks || 0}</p>
                    </div>
                    <div className="bg-gray-800 p-2 rounded text-center">
                      <p className="text-xs text-gray-400">Pomodoros</p>
                      <p className="text-lg font-medium text-white">{selectedProject.pomodoroCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{calculateProjectProgress(selectedProject)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${calculateProjectProgress(selectedProject)}%`, 
                          backgroundColor: selectedProject.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Task Input for Project */}
                <div className="mb-4">
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Add a task to this project..."
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask();
                          e.preventDefault();
                        }
                      }}
                    />
                    <select 
                      className="px-2 bg-gray-700 border-l border-gray-600 text-white"
                      onChange={(e) => setTaskDifficulty(e.target.value)}
                      value={taskDifficulty}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={handleAddTask}
                      className="px-4 py-2 rounded-r-md hover:bg-opacity-90 text-white"
                      style={{ backgroundColor: selectedProject.color }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Project Tasks */}
                <div className="space-y-4">
                  {/* Active Tasks */}
                  <div>
                    <h3 className="font-medium text-gray-400 mb-2">Active Tasks ({activeTasks.length})</h3>
                    <ul className="space-y-2">
                      {activeTasks.map(task => (
                        <li 
                          key={task.id} 
                          className={`flex items-center justify-between p-3 bg-gray-700 rounded-md ${selectedTaskId === task.id ? 'ring-2' : ''}`}
                          style={selectedTaskId === task.id ? { ringColor: themeColors.primary } : {}}
                        >
                          <div className="flex items-center">
                            <button 
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="mr-3 p-1 rounded-full border border-gray-500 hover:bg-gray-600"
                            >
                              <Check size={16} className="text-transparent hover:text-gray-300" />
                            </button>
                            <div>
                              <div className="flex items-center">
                                <span className="text-white">{task.text}</span>
                                {task.difficulty && (
                                  <span className={`text-xs rounded-full px-2 py-0.5 ml-2 ${
                                    task.difficulty === 'easy' ? 'bg-green-900 text-green-300' : 
                                    task.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' : 
                                    'bg-red-900 text-red-300'
                                  }`}>
                                    {task.difficulty}
                                  </span>
                                )}
                              </div>
                              {task.pomodoroCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  ({task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => selectTaskForPomodoro(task.id)}
                              className={`p-1 rounded-md mr-2 ${selectedTaskId === task.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                              style={selectedTaskId === task.id ? { backgroundColor: themeColors.primary } : {}}
                              title="Focus on this task"
                            >
                              <Timer size={16} />
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                      {activeTasks.length === 0 && (
                        <li className="p-3 bg-gray-700 rounded-md text-gray-400 text-center">
                          No active tasks in this project
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Completed Tasks */}
                  <div>
                    <h3 className="font-medium text-gray-400 mb-2">Completed Tasks ({completedTasks.length})</h3>
                    <ul className="space-y-2">
                      {completedTasks.map(task => (
                        <li key={task.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md opacity-70">
                          <div className="flex items-center">
                            <button 
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="mr-3 p-1 rounded-full border border-gray-500"
                              style={{ backgroundColor: themeColors.primary }}
                            >
                              <Check size={16} className="text-white" />
                            </button>
                            <div>
                              <span className="line-through text-white">{task.text}</span>
                              {task.pomodoroCount > 0 && (
                                <span className="text-xs text-gray-400 ml-2">
                                  ({task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                      {completedTasks.length === 0 && (
                        <li className="p-3 bg-gray-700 rounded-md text-gray-400 text-center">
                          No completed tasks in this project
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeView === 'tasks' && (
          // Tasks View (Lists)
          <>
            {/* List Selector */}
            <div className="flex mb-4 space-x-2">
              <button 
                className={`px-3 py-1 rounded-md ${activeList === 'all' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                style={activeList === 'all' ? { backgroundColor: themeColors.primary } : {}}
                onClick={() => setActiveList('all')}
              >
                All
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${activeList === 'work' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                style={activeList === 'work' ? { backgroundColor: themeColors.primary } : {}}
                onClick={() => setActiveList('work')}
              >
                Work
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${activeList === 'personal' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                style={activeList === 'personal' ? { backgroundColor: themeColors.primary } : {}}
                onClick={() => setActiveList('personal')}
              >
                Personal
              </button>
            </div>
            
            {/* Task Input */}
            <div className="mb-2">
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTask();
                      e.preventDefault();
                    }
                  }}
                />
                <select 
                  className="px-2 bg-gray-700 border-l border-gray-600 text-white"
                  onChange={(e) => setNewTaskList(e.target.value)}
                  value={newTaskList}
                >
                  <option value="main">Main</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
                <button 
                  type="button" 
                  onClick={handleAddTask}
                  className="px-4 py-2 rounded-r-md hover:bg-opacity-90 text-white"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {/* Difficulty and Project selection */}
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-400">Difficulty:</span>
                  <button
                    className={`text-xs px-2 py-1 rounded ${taskDifficulty === 'easy' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => setTaskDifficulty('easy')}
                  >
                    Easy
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${taskDifficulty === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => setTaskDifficulty('medium')}
                  >
                    Medium
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${taskDifficulty === 'hard' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => setTaskDifficulty('hard')}
                  >
                    Hard
                  </button>
                </div>
                
                {projects.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-400">Project:</span>
                    <select
                      className="text-xs py-1 px-2 rounded bg-gray-700 text-white"
                      value={activeProject || ""}
                      onChange={(e) => setActiveProject(e.target.value === "" ? null : e.target.value)}
                    >
                      <option value="">None</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 ml-auto flex items-center">
                  <Zap size={14} className="text-yellow-400 mr-1" />
                  {taskDifficulty === 'easy' && `${Math.round(XP_PER_POMODORO * DIFFICULTY_MULTIPLIERS.easy)}XP per pomodoro`}
                  {taskDifficulty === 'medium' && `${XP_PER_POMODORO}XP per pomodoro`}
                  {taskDifficulty === 'hard' && `${Math.round(XP_PER_POMODORO * DIFFICULTY_MULTIPLIERS.hard)}XP per pomodoro`}
                </div>
              </div>
            </div>
            
            {/* Task Lists */}
            <div className="space-y-4">
              {/* Active Tasks */}
              <div>
                <h3 className="font-medium text-gray-400 mb-2">Active Tasks ({activeTasks.length})</h3>
                <ul className="space-y-2">
                  {activeTasks.map(task => {
                    const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                    
                    return (
                      <li 
                        key={task.id} 
                        className={`flex items-center justify-between p-3 bg-gray-700 rounded-md ${selectedTaskId === task.id ? 'ring-2' : ''}`}
                        style={selectedTaskId === task.id ? { ringColor: themeColors.primary } : {}}
                      >
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="mr-3 p-1 rounded-full border border-gray-500 hover:bg-gray-600"
                          >
                            <Check size={16} className="text-transparent hover:text-gray-300" />
                          </button>
                          <div>
                            <div className="flex items-center flex-wrap">
                              <span className="text-white">{task.text}</span>
                              <div className="flex ml-2 space-x-1">
                                {task.difficulty && (
                                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                                    task.difficulty === 'easy' ? 'bg-green-900 text-green-300' : 
                                    task.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' : 
                                    'bg-red-900 text-red-300'
                                  }`}>
                                    {task.difficulty}
                                  </span>
                                )}
                                {project && (
                                  <span 
                                    className="text-xs rounded-full px-2 py-0.5 flex items-center"
                                    style={{ backgroundColor: project.color + '20', color: project.color }}
                                  >
                                    <Folder size={10} className="mr-1" />
                                    {project.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.pomodoroCount > 0 && (
                              <span className="text-xs text-gray-400">
                                ({task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded mr-2 text-gray-300">{task.list}</span>
                          <button
                            onClick={() => selectTaskForPomodoro(task.id)}
                            className={`p-1 rounded-md mr-2 ${selectedTaskId === task.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                            style={selectedTaskId === task.id ? { backgroundColor: themeColors.primary } : {}}
                            title="Focus on this task"
                          >
                            <Timer size={16} />
                          </button>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {activeTasks.length === 0 && (
                    <li className="p-3 bg-gray-700 rounded-md text-gray-400 text-center">
                      No active tasks
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Completed Tasks */}
              <div>
                <h3 className="font-medium text-gray-400 mb-2">Completed Tasks ({completedTasks.length})</h3>
                <ul className="space-y-2">
                  {completedTasks.map(task => {
                    const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                    
                    return (
                      <li key={task.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md opacity-70">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="mr-3 p-1 rounded-full border border-gray-500"
                            style={{ backgroundColor: themeColors.primary }}
                          >
                            <Check size={16} className="text-white" />
                          </button>
                          <div>
                            <div className="flex items-center">
                              <span className="line-through text-white">{task.text}</span>
                              {project && (
                                <span 
                                  className="text-xs rounded-full px-2 py-0.5 ml-2 opacity-70 flex items-center"
                                  style={{ backgroundColor: project.color + '20', color: project.color }}
                                >
                                  <Folder size={10} className="mr-1" />
                                  {project.name}
                                </span>
                              )}
                            </div>
                            {task.pomodoroCount > 0 && (
                              <span className="text-xs text-gray-400">
                                ({task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded mr-2 text-gray-300">{task.list}</span>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {completedTasks.length === 0 && (
                    <li className="p-3 bg-gray-700 rounded-md text-gray-400 text-center">
                      No completed tasks
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Right Column: Pomodoro Timer */}
      <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="mr-2 text-white" />
          <h2 className="text-xl font-bold text-white">Focus Timer</h2>
        </div>
        
        {/* Selected Task for Pomodoro */}
        {selectedTask && (
          <div 
            className="mb-4 p-3 rounded-md flex items-center justify-between"
            style={{ backgroundColor: `${themeColors.secondary}40` }} // 40 is for opacity
          >
            <div>
              <p className="text-sm" style={{ color: themeColors.primary }}>Current Focus:</p>
              <p className="font-medium text-white">{selectedTask.text}</p>
              
              {/* Show project if task belongs to one */}
              {selectedTask.projectId && (
                <div className="mt-1">
                  {projects.map(project => {
                    if (project.id === selectedTask.projectId) {
                      return (
                        <span 
                          key={project.id}
                          className="text-xs rounded-full px-2 py-0.5 flex items-center w-fit"
                          style={{ backgroundColor: project.color + '20', color: project.color }}
                        >
                          <Folder size={10} className="mr-1" />
                          {project.name}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
              
              <div className="text-xs text-gray-400 flex items-center mt-1">
                <Zap size={12} className="text-yellow-400 mr-1" />
                {selectedTask.difficulty === 'easy' && `${Math.round(XP_PER_POMODORO * DIFFICULTY_MULTIPLIERS.easy)}XP`}
                {selectedTask.difficulty === 'medium' && `${XP_PER_POMODORO}XP`}
                {selectedTask.difficulty === 'hard' && `${Math.round(XP_PER_POMODORO * DIFFICULTY_MULTIPLIERS.hard)}XP`}
                {userStats.currentStreak > 1 && ` + ${Math.min(userStats.currentStreak * XP_STREAK_BONUS, XP_PER_POMODORO)}XP streak bonus`}
              </div>
            </div>
            <button 
              onClick={() => setSelectedTaskId(null)}
              className="p-1 hover:text-white hover:bg-gray-700 rounded-md"
              style={{ color: themeColors.primary }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        
        {/* Timer Modes */}
        <div className="flex mb-6 space-x-2">
          <button 
            className={`flex-1 px-3 py-2 rounded-md ${timerMode === 'pomodoro' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            style={timerMode === 'pomodoro' ? { backgroundColor: themeColors.primary } : {}}
            onClick={() => changeTimerMode('pomodoro')}
          >
            Pomodoro
          </button>
          <button 
            className={`flex-1 px-3 py-2 rounded-md ${timerMode === 'shortBreak' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            style={timerMode === 'shortBreak' ? { backgroundColor: themeColors.primary } : {}}
            onClick={() => changeTimerMode('shortBreak')}
          >
            Short Break
          </button>
          <button 
            className={`flex-1 px-3 py-2 rounded-md ${timerMode === 'longBreak' ? 'text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            style={timerMode === 'longBreak' ? { backgroundColor: themeColors.primary } : {}}
            onClick={() => changeTimerMode('longBreak')}
          >
            Long Break
          </button>
        </div>
        
        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-4 text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          
          {/* Timer Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <button 
                onClick={startTimer}
                className="p-3 bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Play size={24} className="text-white" />
              </button>
            ) : (
              <button 
                onClick={pauseTimer}
                className="p-3 bg-yellow-600 rounded-full hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <Pause size={24} className="text-white" />
              </button>
            )}
            <button 
              onClick={resetTimer}
              className="p-3 bg-gray-600 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <RotateCcw size={24} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* Timer Status */}
        <div className="bg-gray-700 p-4 rounded-md text-center">
          {isActive ? (
            <p className="text-white">
              {timerMode === 'pomodoro' 
                ? selectedTask 
                  ? `Focusing on: ${selectedTask.text} 🧠` 
                  : 'Focus on your task! 🧠' 
                : 'Take a break and relax. ☕'}
            </p>
          ) : (
            <p className="text-white">
              {selectedTask 
                ? `Ready to focus on: ${selectedTask.text}`
                : 'Timer paused. Press play to start your session.'}
            </p>
          )}
        </div>
        
        {/* Today's Summary */}
        <div className="mt-6 bg-gray-700 p-4 rounded-md">
          <h3 className="font-bold mb-2 text-white">Today's Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Today's XP</p>
              <p className="text-2xl font-bold text-white">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  let todayXP = 0;
                  
                  // XP from pomodoros
                  pomodoroHistory.forEach(p => {
                    if (p.dateFormatted === today) {
                      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[p.difficulty] || 1;
                      const streakBonus = Math.min(userStats.currentStreak * XP_STREAK_BONUS, XP_PER_POMODORO);
                      const pomodoroXP = Math.round((XP_PER_POMODORO + streakBonus) * difficultyMultiplier);
                      todayXP += pomodoroXP;
                    }
                  });
                  
                  return todayXP;
                })()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Minutes Focused</p>
              <p className="text-2xl font-bold text-white">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  return pomodoroHistory
                    .filter(p => p.dateFormatted === today)
                    .reduce((total, p) => total + p.duration, 0);
                })()}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">Pomodoros completed today</p>
              <p className="text-sm font-bold text-white">
                {pomodoroHistory.filter(p => p.dateFormatted === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <div className="mt-2 flex space-x-1">
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayPomodoroCount = pomodoroHistory.filter(p => p.dateFormatted === today).length;
                
                return Array.from({ length: 12 }).map((_, i) => {
                  const completed = todayPomodoroCount > i;
                  return (
                    <div 
                      key={i}
                      className={`h-2 flex-1 rounded-full ${completed ? '' : 'bg-gray-600'}`}
                      style={{ backgroundColor: completed ? themeColors.primary : '' }}
                    ></div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        
        {/* Streak & Level Info */}
        <div className="mt-6 bg-gray-700 p-4 rounded-md">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-white">Current Level</h3>
            <span className="text-xl font-bold text-white">{userStats.level}</span>
          </div>
          <div className="w-full h-2 bg-gray-600 rounded-full mb-1">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${calculateLevelProgress()}%`,
                backgroundColor: themeColors.primary 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{LEVEL_XP_REQUIREMENTS[userStats.level - 1]} XP</span>
            <span>{userStats.xp} / {userStats.nextLevelXp} XP</span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">Current Streak</p>
              <div className="flex items-center">
                <Flame size={16} className="text-yellow-400 mr-1" />
                <p className="text-sm font-bold text-white">{userStats.currentStreak} days</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-400">Streak Bonus</p>
              <p className="text-sm font-bold text-white">
                +{Math.min(userStats.currentStreak * XP_STREAK_BONUS, XP_PER_POMODORO)}XP per pomodoro
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <footer className="bg-gray-800 py-3 px-6 text-center text-gray-400 text-sm">
      <p>Productivity Quest - Level up your productivity!</p>
    </footer>
  </div>
);
};

export default ProductivityApp;