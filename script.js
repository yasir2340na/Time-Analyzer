// Time Analyzer - Main JavaScript File
// Module 3: Data Storage & Module 4: Analysis Engine

// Global state
let activities = [];

// Navigation functionality (Module 1)
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupActivityForm();
    setDefaultDate();
    loadActivitiesFromStorage();
    setupDashboard();
    console.log('Time Analyzer initialized');
}

// Navigation between sections
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.getAttribute('data-section');
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

// ===== MODULE 2: Activity Input Module =====

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Prevent future dates
}

// Setup activity form handling
function setupActivityForm() {
    const form = document.getElementById('activity-form');
    form.addEventListener('submit', handleFormSubmit);
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const activityData = {
        id: Date.now(), // Unique ID
        activityName: formData.get('activityName').trim(),
        category: formData.get('category'),
        hours: parseInt(formData.get('hours')),
        minutes: parseInt(formData.get('minutes')),
        date: formData.get('date'),
        notes: formData.get('notes').trim(),
        createdAt: new Date().toISOString()
    };
    
    // Validate form data
    if (validateActivityData(activityData)) {
        // Save to localStorage (Module 3)
        if (addActivity(activityData)) {
            console.log('Activity saved:', activityData);
            
            // Show success message
            showFormMessage('Activity added successfully! 🎉', 'success');
            
            // Reset form
            event.target.reset();
            setDefaultDate();
        } else {
            showFormMessage('Error saving activity. Please try again.', 'error');
        }
    }
}

// Validate activity data
function validateActivityData(data) {
    const messageElement = document.getElementById('form-message');
    
    // Check activity name
    if (!data.activityName || data.activityName.length < 2) {
        showFormMessage('Please enter a valid activity name (at least 2 characters)', 'error');
        return false;
    }
    
    // Check category
    if (!data.category) {
        showFormMessage('Please select a category', 'error');
        return false;
    }
    
    // Check time (at least 1 minute)
    const totalMinutes = data.hours * 60 + data.minutes;
    if (totalMinutes < 1) {
        showFormMessage('Please enter a valid time (at least 1 minute)', 'error');
        return false;
    }
    
    // Check time not exceeding 24 hours
    if (totalMinutes > 1440) {
        showFormMessage('Time cannot exceed 24 hours', 'error');
        return false;
    }
    
    // Check date
    if (!data.date) {
        showFormMessage('Please select a date', 'error');
        return false;
    }
    
    // Check if date is not in future
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        showFormMessage('Cannot add activities for future dates', 'error');
        return false;
    }
    
    return true;
}

// Show form message
function showFormMessage(message, type) {
    const messageElement = document.getElementById('form-message');
    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
}

// ===== MODULE 3: Data Storage Module =====

// Save activities to localStorage
function saveActivitiesToStorage() {
    try {
        localStorage.setItem('timeAnalyzerActivities', JSON.stringify(activities));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

// Load activities from localStorage
function loadActivitiesFromStorage() {
    try {
        const stored = localStorage.getItem('timeAnalyzerActivities');
        if (stored) {
            activities = JSON.parse(stored);
            console.log(`Loaded ${activities.length} activities from storage`);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        activities = [];
    }
}

// Add new activity
function addActivity(activityData) {
    activities.push(activityData);
    if (saveActivitiesToStorage()) {
        updateDashboard();
        return true;
    }
    return false;
}

// Delete activity by ID
function deleteActivity(id) {
    const index = activities.findIndex(activity => activity.id === id);
    if (index !== -1) {
        activities.splice(index, 1);
        saveActivitiesToStorage();
        updateDashboard();
        return true;
    }
    return false;
}

// Update activity by ID
function updateActivity(id, updatedData) {
    const index = activities.findIndex(activity => activity.id === id);
    if (index !== -1) {
        activities[index] = { ...activities[index], ...updatedData };
        saveActivitiesToStorage();
        updateDashboard();
        return true;
    }
    return false;
}

// Clear all activities
function clearAllActivities() {
    if (confirm('Are you sure you want to delete all activities? This cannot be undone!')) {
        activities = [];
        saveActivitiesToStorage();
        updateDashboard();
        showFormMessage('All activities have been cleared!', 'success');
    }
}

// Get activities by category
function getActivitiesByCategory(category) {
    if (category === 'all') return activities;
    return activities.filter(activity => activity.category === category);
}

// ===== Dashboard Functions =====

function setupDashboard() {
    // Refresh button
    document.getElementById('refresh-dashboard').addEventListener('click', () => {
        updateDashboard();
        showFormMessage('Dashboard refreshed!', 'success');
    });
    
    // Category filter
    document.getElementById('filter-category').addEventListener('change', (e) => {
        displayActivities(e.target.value);
    });
    
    // Clear all button
    document.getElementById('clear-all-data').addEventListener('click', clearAllActivities);
    
    // Initial load
    updateDashboard();
}

function updateDashboard() {
    updateStats();
    displayActivities('all');
}

function updateStats() {
    // Total activities
    document.getElementById('total-activities').textContent = activities.length;
    
    // Total time
    const totalMinutes = activities.reduce((sum, activity) => {
        return sum + (activity.hours * 60) + activity.minutes;
    }, 0);
    document.getElementById('total-hours').textContent = formatTime(totalMinutes);
    
    // Today's time
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter(activity => activity.date === today);
    const todayMinutes = todayActivities.reduce((sum, activity) => {
        return sum + (activity.hours * 60) + activity.minutes;
    }, 0);
    document.getElementById('today-time').textContent = formatTime(todayMinutes);
}

function displayActivities(category = 'all') {
    const container = document.getElementById('activities-container');
    const filteredActivities = getActivitiesByCategory(category);
    
    if (filteredActivities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No activities found. ${category !== 'all' ? 'Try a different filter!' : 'Start by adding your first activity!'}</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedActivities = [...filteredActivities].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = sortedActivities.map(activity => createActivityCard(activity)).join('');
    
    // Add event listeners for action buttons
    sortedActivities.forEach(activity => {
        document.getElementById(`delete-${activity.id}`).addEventListener('click', () => {
            if (confirm(`Delete activity "${activity.activityName}"?`)) {
                deleteActivity(activity.id);
            }
        });
    });
}

function createActivityCard(activity) {
    const categoryEmojis = {
        study: '📚',
        work: '💼',
        sleep: '😴',
        leisure: '🎮',
        exercise: '🏃',
        social: '👥',
        other: '📌'
    };
    
    const totalMinutes = activity.hours * 60 + activity.minutes;
    const timeDisplay = formatTime(totalMinutes);
    const dateDisplay = formatDate(activity.date);
    
    return `
        <div class="activity-card">
            <div class="activity-header">
                <div>
                    <div class="activity-name">${activity.activityName}</div>
                    <span class="activity-category category-${activity.category}">
                        ${categoryEmojis[activity.category]} ${capitalizeFirst(activity.category)}
                    </span>
                </div>
            </div>
            <div class="activity-time">
                ⏱️ ${timeDisplay}
            </div>
            <div class="activity-date">
                📅 ${dateDisplay}
            </div>
            ${activity.notes ? `<div class="activity-notes">"${activity.notes}"</div>` : ''}
            <div class="activity-actions">
                <button class="btn-delete" id="delete-${activity.id}">🗑️ Delete</button>
            </div>
        </div>
    `;
}

// Helper functions
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];
    
    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === yesterdayOnly) return 'Yesterday';
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
