// Time Analyzer - Main JavaScript File
// Module 3: Data Storage & Module 4: Analysis Engine

// Navigation functionality (Module 1)
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupActivityForm();
    setDefaultDate();
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
        // TODO: Save to localStorage (Module 3)
        console.log('Activity Data:', activityData);
        
        // Show success message
        showFormMessage('Activity added successfully! 🎉', 'success');
        
        // Reset form
        event.target.reset();
        setDefaultDate();
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
