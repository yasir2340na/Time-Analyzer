// Time Analyzer - Main JavaScript File
// Module 3: Data Storage & Module 4: Analysis Engine

// Global state
let activities = [];
let chartInstances = {};

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
    setupReports();
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
            
            // Refresh reports when navigating to reports section
            if (targetSection === 'reports') {
                const timeRange = document.getElementById('time-range').value;
                updateReports(timeRange);
            }
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
        // Also update reports if they exist
        if (document.getElementById('time-range')) {
            updateReports(document.getElementById('time-range').value);
        }
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

// ===== MODULE 4: Time Analysis Engine =====

// Define productive vs unproductive categories
const productiveCategories = ['study', 'work', 'exercise'];
const unproductiveCategories = ['leisure', 'social', 'sleep', 'other'];

// Setup reports section
function setupReports() {
    document.getElementById('time-range').addEventListener('change', (e) => {
        updateReports(e.target.value);
    });
    
    // Smart suggestions refresh button
    document.getElementById('refresh-suggestions').addEventListener('click', () => {
        updateSmartSuggestions(activities);
    });
    
    // Initial load with week view
    updateReports('week');
}

// Update all reports
function updateReports(timeRange = 'week') {
    const filteredActivities = filterByTimeRange(activities, timeRange);
    
    updateCharts(filteredActivities, timeRange);
    updateProductivityAnalysis(filteredActivities);
    updateCategoryBreakdown(filteredActivities);
    updateDailySummary(filteredActivities);
    updateInsights(filteredActivities, timeRange);
    updateSmartSuggestions(activities); // Use all activities for pattern detection
}

// Filter activities by time range
function filterByTimeRange(activities, range) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(range) {
        case 'today':
            return activities.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate.toDateString() === today.toDateString();
            });
        
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return activities.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate >= weekAgo;
            });
        
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return activities.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate >= monthAgo;
            });
        
        case 'all':
        default:
            return activities;
    }
}

// Calculate productivity analysis
function updateProductivityAnalysis(activities) {
    if (activities.length === 0) {
        document.getElementById('productive-time').textContent = '0h 0m';
        document.getElementById('productive-percent').textContent = '0%';
        document.getElementById('unproductive-time').textContent = '0h 0m';
        document.getElementById('unproductive-percent').textContent = '0%';
        return;
    }
    
    const productiveTime = activities
        .filter(a => productiveCategories.includes(a.category))
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    
    const unproductiveTime = activities
        .filter(a => unproductiveCategories.includes(a.category))
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    
    const totalTime = productiveTime + unproductiveTime;
    
    const productivePercent = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    const unproductivePercent = totalTime > 0 ? Math.round((unproductiveTime / totalTime) * 100) : 0;
    
    document.getElementById('productive-time').textContent = formatTime(productiveTime);
    document.getElementById('productive-percent').textContent = `${productivePercent}%`;
    document.getElementById('unproductive-time').textContent = formatTime(unproductiveTime);
    document.getElementById('unproductive-percent').textContent = `${unproductivePercent}%`;
}

// Update category breakdown
function updateCategoryBreakdown(activities) {
    const container = document.getElementById('category-breakdown');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-analysis">
                <div class="empty-analysis-icon">📊</div>
                <p>No data available for the selected time range</p>
            </div>
        `;
        return;
    }
    
    // Calculate time per category
    const categoryData = {};
    const categoryEmojis = {
        study: '📚',
        work: '💼',
        sleep: '😴',
        leisure: '🎮',
        exercise: '🏃',
        social: '👥',
        other: '📌'
    };
    
    activities.forEach(activity => {
        const category = activity.category;
        const minutes = activity.hours * 60 + activity.minutes;
        
        if (!categoryData[category]) {
            categoryData[category] = {
                time: 0,
                count: 0,
                emoji: categoryEmojis[category]
            };
        }
        
        categoryData[category].time += minutes;
        categoryData[category].count += 1;
    });
    
    // Get total time for percentage calculation
    const totalTime = Object.values(categoryData).reduce((sum, cat) => sum + cat.time, 0);
    
    // Sort by time (descending)
    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1].time - a[1].time);
    
    container.innerHTML = sortedCategories.map(([category, data]) => {
        const percentage = Math.round((data.time / totalTime) * 100);
        return `
            <div class="category-item">
                <div class="category-header">
                    <span class="category-title">
                        <span>${data.emoji}</span>
                        <span>${capitalizeFirst(category)}</span>
                    </span>
                    <span class="category-time">${formatTime(data.time)}</span>
                </div>
                <div class="category-bar-container">
                    <div class="category-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="category-count">${data.count} ${data.count === 1 ? 'activity' : 'activities'} • ${percentage}% of total time</div>
            </div>
        `;
    }).join('');
}

// Update daily summary
function updateDailySummary(activities) {
    const container = document.getElementById('daily-summary');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-analysis">
                <div class="empty-analysis-icon">📅</div>
                <p>No activities recorded yet</p>
            </div>
        `;
        return;
    }
    
    // Group activities by date
    const dailyData = {};
    
    activities.forEach(activity => {
        const date = activity.date;
        if (!dailyData[date]) {
            dailyData[date] = {
                activities: [],
                totalMinutes: 0
            };
        }
        dailyData[date].activities.push(activity);
        dailyData[date].totalMinutes += activity.hours * 60 + activity.minutes;
    });
    
    // Sort by date (newest first)
    const sortedDays = Object.entries(dailyData)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 7); // Show last 7 days
    
    container.innerHTML = sortedDays.map(([date, data]) => {
        const dateDisplay = formatDate(date);
        const activityTags = data.activities
            .map(a => `<span class="day-activity-tag">${a.activityName}</span>`)
            .join('');
        
        return `
            <div class="day-card">
                <div class="day-header">
                    <span class="day-name">📅 ${dateDisplay}</span>
                    <span class="day-total">⏱️ ${formatTime(data.totalMinutes)}</span>
                </div>
                <div class="day-activities">
                    ${activityTags}
                </div>
            </div>
        `;
    }).join('');
}

// Generate insights and recommendations
function updateInsights(activities, timeRange) {
    const container = document.getElementById('insights-container');
    const insights = [];
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-analysis">
                <div class="empty-analysis-icon">💡</div>
                <p>Start tracking activities to get personalized insights!</p>
            </div>
        `;
        return;
    }
    
    // Calculate metrics
    const totalTime = activities.reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    const productiveTime = activities
        .filter(a => productiveCategories.includes(a.category))
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    const leisureTime = activities
        .filter(a => a.category === 'leisure')
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    const sleepTime = activities
        .filter(a => a.category === 'sleep')
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    const exerciseTime = activities
        .filter(a => a.category === 'exercise')
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    
    const productivePercent = (productiveTime / totalTime) * 100;
    const leisurePercent = (leisureTime / totalTime) * 100;
    
    // Insight 1: Productivity level
    if (productivePercent >= 60) {
        insights.push({
            type: 'success',
            icon: '🎉',
            title: 'Excellent Productivity!',
            description: `You're spending ${Math.round(productivePercent)}% of your time on productive activities. Keep up the great work!`
        });
    } else if (productivePercent >= 40) {
        insights.push({
            type: 'info',
            icon: '💪',
            title: 'Good Balance',
            description: `${Math.round(productivePercent)}% productivity rate. Consider increasing study or work time slightly.`
        });
    } else {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Low Productivity Alert',
            description: `Only ${Math.round(productivePercent)}% of your time is spent productively. Try to increase work or study time.`
        });
    }
    
    // Insight 2: Leisure time
    if (leisurePercent > 40) {
        insights.push({
            type: 'warning',
            icon: '🎮',
            title: 'High Leisure Time',
            description: `You're spending ${Math.round(leisurePercent)}% of your time on leisure activities. Consider balancing with more productive tasks.`
        });
    }
    
    // Insight 3: Sleep
    const avgDailySleep = sleepTime / Math.max(1, new Set(activities.map(a => a.date)).size);
    if (avgDailySleep < 360) { // Less than 6 hours
        insights.push({
            type: 'warning',
            icon: '😴',
            title: 'Insufficient Sleep',
            description: `Average ${formatTime(avgDailySleep)} sleep per day. Aim for 7-8 hours for better health and productivity.`
        });
    } else if (avgDailySleep >= 420 && avgDailySleep <= 540) {
        insights.push({
            type: 'success',
            icon: '😊',
            title: 'Healthy Sleep Pattern',
            description: `Great! You're averaging ${formatTime(avgDailySleep)} of sleep per day.`
        });
    }
    
    // Insight 4: Exercise
    if (exerciseTime === 0) {
        insights.push({
            type: 'warning',
            icon: '🏃',
            title: 'No Exercise Recorded',
            description: 'Try to include at least 30 minutes of exercise daily for better health!'  
        });
    } else if (exerciseTime > 0) {
        insights.push({
            type: 'success',
            icon: '💪',
            title: 'Active Lifestyle',
            description: `You've logged ${formatTime(exerciseTime)} of exercise. Keep moving!`
        });
    }
    
    // Insight 5: Most time spent
    const categoryTimes = {};
    activities.forEach(a => {
        const cat = a.category;
        categoryTimes[cat] = (categoryTimes[cat] || 0) + (a.hours * 60 + a.minutes);
    });
    const topCategory = Object.entries(categoryTimes).sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
        const categoryEmojis = {
            study: '📚', work: '💼', sleep: '😴', leisure: '🎮',
            exercise: '🏃', social: '👥', other: '📌'
        };
        insights.push({
            type: 'info',
            icon: categoryEmojis[topCategory[0]],
            title: 'Top Activity',
            description: `Most time spent on ${topCategory[0]} (${formatTime(topCategory[1])}). ${timeRange === 'week' ? 'This week' : timeRange === 'today' ? 'Today' : 'In this period'}.`
        });
    }
    
    // Render insights
    container.innerHTML = insights.map(insight => `
        <div class="insight-card ${insight.type}">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
            </div>
        </div>
    `).join('');
}

// ===== MODULE 5: Chart Visualizations =====

// Destroy existing chart if it exists
function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

// Update all charts
function updateCharts(activities, timeRange) {
    if (activities.length === 0) {
        showNoDataCharts();
        return;
    }
    
    createCategoryPieChart(activities);
    createProductivityDoughnutChart(activities);
    createDailyBarChart(activities, timeRange);
    createWeeklyLineChart(activities);
}

// Show no data message for charts
function showNoDataCharts() {
    const chartIds = ['categoryPieChart', 'productivityDoughnutChart', 'dailyBarChart', 'weeklyLineChart'];
    chartIds.forEach(id => {
        destroyChart(id);
        const canvas = document.getElementById(id);
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="chart-header">
                <h4>${container.querySelector('h4').textContent}</h4>
            </div>
            <div class="no-data-chart">
                <div class="no-data-chart-icon">📊</div>
                <p>No data available for visualization</p>
            </div>
        `;
    });
}

// Category Pie Chart
function createCategoryPieChart(activities) {
    destroyChart('categoryPieChart');
    
    const categoryData = {};
    const categoryColors = {
        study: '#2196f3',
        work: '#ff9800',
        sleep: '#9c27b0',
        leisure: '#4caf50',
        exercise: '#e91e63',
        social: '#00bcd4',
        other: '#757575'
    };
    
    activities.forEach(activity => {
        const category = activity.category;
        const minutes = activity.hours * 60 + activity.minutes;
        categoryData[category] = (categoryData[category] || 0) + minutes;
    });
    
    const labels = Object.keys(categoryData).map(cat => capitalizeFirst(cat));
    const data = Object.values(categoryData);
    const colors = Object.keys(categoryData).map(cat => categoryColors[cat]);
    
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    chartInstances['categoryPieChart'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatTime(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Productivity Doughnut Chart
function createProductivityDoughnutChart(activities) {
    destroyChart('productivityDoughnutChart');
    
    const productiveTime = activities
        .filter(a => productiveCategories.includes(a.category))
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    
    const unproductiveTime = activities
        .filter(a => unproductiveCategories.includes(a.category))
        .reduce((sum, a) => sum + (a.hours * 60 + a.minutes), 0);
    
    const ctx = document.getElementById('productivityDoughnutChart').getContext('2d');
    chartInstances['productivityDoughnutChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Productive', 'Unproductive'],
            datasets: [{
                data: [productiveTime, unproductiveTime],
                backgroundColor: [
                    '#4caf50',
                    '#ff5722'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatTime(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Daily Bar Chart
function createDailyBarChart(activities, timeRange) {
    destroyChart('dailyBarChart');
    
    const dailyData = {};
    
    activities.forEach(activity => {
        const date = activity.date;
        const minutes = activity.hours * 60 + activity.minutes;
        dailyData[date] = (dailyData[date] || 0) + minutes;
    });
    
    // Sort by date
    const sortedDates = Object.keys(dailyData).sort();
    const labels = sortedDates.map(date => formatDate(date));
    const data = sortedDates.map(date => dailyData[date] / 60); // Convert to hours
    
    const ctx = document.getElementById('dailyBarChart').getContext('2d');
    chartInstances['dailyBarChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours per Day',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'h';
                        },
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hours = Math.floor(context.parsed.y);
                            const minutes = Math.round((context.parsed.y - hours) * 60);
                            return `Time: ${hours}h ${minutes}m`;
                        }
                    }
                }
            }
        }
    });
}

// Weekly Line Chart
function createWeeklyLineChart(activities) {
    destroyChart('weeklyLineChart');
    
    const dailyData = {};
    
    activities.forEach(activity => {
        const date = activity.date;
        const minutes = activity.hours * 60 + activity.minutes;
        dailyData[date] = (dailyData[date] || 0) + minutes;
    });
    
    // Get last 14 days
    const today = new Date();
    const dates = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    const labels = dates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    const data = dates.map(date => (dailyData[date] || 0) / 60); // Convert to hours
    
    const ctx = document.getElementById('weeklyLineChart').getContext('2d');
    chartInstances['weeklyLineChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Hours Trend',
                data: data,
                borderColor: 'rgba(118, 75, 162, 1)',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(118, 75, 162, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'h';
                        },
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hours = Math.floor(context.parsed.y);
                            const minutes = Math.round((context.parsed.y - hours) * 60);
                            return `Time: ${hours}h ${minutes}m`;
                        }
                    }
                }
            }
        }
    });
}
