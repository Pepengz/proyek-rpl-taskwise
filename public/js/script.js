// Add SweetAlert2 compatibility layer at the start
if (typeof Swal !== 'undefined' && typeof swal === 'undefined') {
    window.swal = Swal.fire;
}

// Update the showAlert function to use SweetAlert2 parameters
function showAlert(options) {
    if (typeof Swal !== 'undefined') {
        // Convert SweetAlert1 parameters to SweetAlert2
        const swal2Options = {
            title: options.title,
            text: options.text,
            icon: options.icon,
            showCancelButton: options.buttons && options.buttons.cancel,
            cancelButtonText: options.buttons?.cancel?.text || 'Cancel',
            confirmButtonText: options.buttons?.confirm?.text || 'OK',
            confirmButtonColor: options.dangerMode ? '#dc3545' : '#3085d6',
            cancelButtonColor: '#6c757d'
        };
        return Swal.fire(swal2Options);
    } else {
        alert(options.text || options.title);
        return Promise.resolve(true);
    }
}

// Add a check for SweetAlert at the start
if (typeof swal === 'undefined') {
    // Define a temporary swal function that will queue calls until the real one loads
    window.swal = function(...args) {
        console.warn('SweetAlert not loaded yet. Retrying...');
        setTimeout(() => {
            if (typeof window.sweetAlert === 'function') {
                window.sweetAlert(...args);
            }
        }, 500);
    };
}

if ('Notification' in window) {
    Notification.requestPermission();
}

function checkReminders() {
    const tasks = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "userPreferences") {
            try {
                const task = JSON.parse(localStorage.getItem(key));
                if (task && task.reminderTime) {
                    const reminderTime = new Date(task.reminderTime);
                    if (reminderTime > new Date() && reminderTime - new Date() <= 300000) { // 5 minutes
                        notifyUser(task);
                    }
                }
            } catch (e) {
                console.error("Error parsing task:", e);
            }
        }
    }
}

function notifyUser(task) {
    if (Notification.permission === "granted") {
        new Notification("Task Reminder", {
            body: `Task "${task.text}" is due at ${new Date(task.date).toLocaleTimeString()}`,
            icon: "/img/ico.png"
        });
    }
}

function showDivisionsWithDelay() {
    const cardDivisions = document.querySelectorAll(".card");
    const delay = 300;

    cardDivisions.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = 1;
        }, (index + 1) * delay);
    });
}

let currentSection = "myDay";
let titleLink; // Global declaration

// Move isToday to global scope
const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
};

function isTaskOverdue(task) {
    if (!task || task.completed) return false;
    const taskDateTime = new Date(task.date + 'T' + (task.time || '23:59:59'));
    return taskDateTime < new Date();
}

// Remove or comment out the checkOverdueTasks function since we're not using bell icons anymore
// function checkOverdueTasks() { ... }

function displayTasks(section, tasksToDisplay) {
    currentSection = section;
    
    const tasks = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "userPreferences") {
            try {
                const task = JSON.parse(localStorage.getItem(key));
                if (task) tasks.push(task);
            } catch (e) {
                console.error("Error parsing task:", e);
                continue;
            }
        }
    }

    const tasksToRender = tasksToDisplay || tasks;
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    const todayDate = new Date().toLocaleDateString("en-CA");

    const filteredTasks = tasksToRender.filter((task) => {
        switch (section) {
            case "myDay":
                if (titleLink) titleLink.textContent = "My Day";
                return task.date === todayDate;
            case "thisWeek":
                if (titleLink) titleLink.textContent = "Current Week";
                const taskDate = new Date(task.date);
                const today = new Date();
                const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                return taskDate >= startOfWeek && taskDate <= endOfWeek;
            case "thisMonth":
                if (titleLink) titleLink.textContent = "Current Month";
                const taskMonth = new Date(task.date);
                const currentDate = new Date();
                return taskMonth.getMonth() === currentDate.getMonth() && 
                       taskMonth.getFullYear() === currentDate.getFullYear();
            case "other":
                if (titleLink) titleLink.textContent = "All tasks";
                return true;
            default:
                return false;
        }
    });

    const taskContainer = document.getElementById("TaskContainer");
    taskContainer.innerHTML = filteredTasks
        .map((task) => {
            const isOverdue = isTaskOverdue(task);
            return `
                <div class="card align ${isOverdue && !task.completed ? 'task-overdue' : ''}" data-task-id="${task.id}">
                    <input type="checkbox" name="task" id="${task.id}" ${task.completed ? "checked" : ""}>
                    <div ${task.completed ? 'class="marker done"' : 'class="marker"'}>
                        <span>${task.text}</span>
                        <p id="taskDate" class="date ${isToday(task.date) ? "today" : ""} ${isOverdue ? 'overdue' : ''}">${
                            isToday(task.date) ? "Today" : "<i class='bx bx-calendar-alt'></i> " + task.date
                        } <i class='bx bx-time-five'></i> ${task.time}</p>
                    </div>
                    <div class="task-actions">
                        <i class='bx bx-trash delete-task'></i>
                    </div>
                </div>
            `;
        })
        .join("");

    // Update trash button event listeners
    const trashButtons = document.querySelectorAll('.bx-trash.delete-task');
    trashButtons.forEach(button => {
        button.addEventListener('click', function() {
            const taskElement = this.closest('.card');
            const taskId = taskElement.dataset.taskId;
            
            Swal.fire({
                title: 'Delete Task?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No, keep it',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem(taskId);
                    taskElement.remove();
                    Swal.fire(
                        'Deleted!',
                        'Your task has been deleted.',
                        'success'
                    );
                }
            });
        });
    });

    showDivisionsWithDelay();
}

function generateProductivityReport() {
    const tasks = [];
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const stats = {
        totalTasks: 0,
        completedTasks: 0,
        weeklyProgress: Array(7).fill(0)
    };

    // Collect tasks data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "userPreferences") {
            try {
                const task = JSON.parse(localStorage.getItem(key));
                if (task) {
                    stats.totalTasks++;
                    if (task.completed) stats.completedTasks++;
                    
                    // Weekly progress
                    const taskDate = new Date(task.date);
                    if (taskDate >= startOfWeek) {
                        const dayIndex = taskDate.getDay();
                        stats.weeklyProgress[dayIndex]++;
                    }
                }
            } catch (e) {
                console.error("Error parsing task:", e);
            }
        }
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const completionRate = ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1);

    const reportHtml = `
        <div class="productivity-report">
            <div class="report-section">
                <h3>Overall Progress</h3>
                <div class="stat-box">
                    <div>Total Tasks: ${stats.totalTasks}</div>
                    <div>Completed: ${stats.completedTasks}</div>
                    <div>Completion Rate: ${completionRate}%</div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Weekly Tasks Distribution</h3>
                <div class="weekly-chart">
                    ${weekDays.map((day, i) => `
                        <div class="chart-bar">
                            <div class="bar" style="height: ${stats.weeklyProgress[i] * 20}px"></div>
                            <div class="day">${day}</div>
                            <div class="count">${stats.weeklyProgress[i]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const taskContainer = document.getElementById("TaskContainer");
    taskContainer.innerHTML = reportHtml;
    
    if (titleLink) titleLink.textContent = "Productivity Report";
}

function displayProgressTracking() {
    const progressHtml = `
        <div class="progress-tracking">
            <div class="tracking-section">
                <h3>Task Completion Progress</h3>
                <div class="completion-indicator">
                    <div class="indicator-value" id="completionRate">0%</div>
                    <div class="indicator-label">Tasks Completed</div>
                </div>
            </div>
            <div class="tracking-section">
                <h3>Daily Progress</h3>
                <div class="progress-graph">
                    <canvas id="dailyProgressChart"></canvas>
                </div>
            </div>
            <div class="tracking-section">
                <h3>Weekly Overview</h3>
                <div class="progress-graph">
                    <canvas id="weeklyProgressChart"></canvas>
                </div>
            </div>
        </div>
    `;

    const taskContainer = document.getElementById("TaskContainer");
    taskContainer.innerHTML = progressHtml;
    
    // Get real data and initialize charts
    const progressData = calculateProgressData();
    document.getElementById('completionRate').textContent = `${progressData.completionRate}%`;
    createDailyProgressChart(progressData.dailyData);
    createWeeklyOverviewChart(progressData.weeklyData);
}

function calculateProgressData() {
    const now = new Date();
    let totalTasks = 0;
    let completedTasks = 0;

    // Initialize data structures
    const dailyData = {
        labels: [],
        completed: [],
        total: []
    };
    
    const weeklyData = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        completed: Array(7).fill(0),
        total: Array(7).fill(0)
    };

    // Initialize last 7 days data
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        dailyData.completed.push(0);
        dailyData.total.push(0);
    }

    // Process tasks from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "userPreferences") {
            try {
                const task = JSON.parse(localStorage.getItem(key));
                if (task) {
                    totalTasks++;
                    if (task.completed) completedTasks++;

                    const taskDate = new Date(task.date);
                    const daysAgo = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));
                    const dayIndex = taskDate.getDay();

                    // Update weekly data
                    weeklyData.total[dayIndex]++;
                    if (task.completed) weeklyData.completed[dayIndex]++;

                    // Update daily data if within last 7 days
                    if (daysAgo >= 0 && daysAgo < 7) {
                        const dailyIndex = 6 - daysAgo;
                        dailyData.total[dailyIndex]++;
                        if (task.completed) dailyData.completed[dailyIndex]++;
                    }
                }
            } catch (e) {
                console.error("Error parsing task:", e);
            }
        }
    }

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        completionRate,
        dailyData,
        weeklyData
    };
}

function createDailyProgressChart(data) {
    const ctx = document.getElementById('dailyProgressChart').getContext('2d');
    
    if (window.dailyChart) {
        window.dailyChart.destroy();
    }

    window.dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: data.completed,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Total Tasks',
                    data: data.total,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tasks'
                    }
                }
            }
        }
    });
}

function createWeeklyOverviewChart(data) {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
    
    if (window.weeklyChart) {
        window.weeklyChart.destroy();
    }

    window.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: data.completed,
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Tasks',
                    data: data.total,
                    backgroundColor: 'rgba(33, 150, 243, 0.6)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tasks'
                    }
                }
            }
        }
    });
}

// Add this function to update progress tracking in real-time
function updateProgressTracking() {
    if (currentSection === 'progress') {
        displayProgressTracking();
    }
}

// Replace the removed checkOverdueTasks function with a simplified version
function checkOverdueTasks() {
    // We'll just update any overdue task styling
    const tasks = document.querySelectorAll('.card');
    tasks.forEach(taskElement => {
        const taskId = taskElement.dataset.taskId;
        const task = JSON.parse(localStorage.getItem(taskId));
        if (task) {
            const isOverdue = isTaskOverdue(task);
            const dateElement = taskElement.querySelector('#taskDate');
            const markerElement = taskElement.querySelector('.marker');
            
            if (isOverdue && !markerElement.classList.contains('done')) {
                dateElement.classList.add('overdue');
                taskElement.classList.add('task-overdue');
            } else {
                dateElement.classList.remove('overdue');
                taskElement.classList.remove('task-overdue');
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    titleLink = document.getElementById("header_title"); // Initialize the global variable
    
    document.getElementById('duedate').valueAsDate = new Date();
    const taskContainer = document.getElementById("TaskContainer");
    const addButton = document.querySelector(".bx-plus");
    const textInput = document.getElementById("todo");
    const dateInput = document.getElementById("duedate");
    const myDayLink = document.getElementById("o1");
    const thisWeekLink = document.getElementById("o2");
    const thisMonthLink = document.getElementById("o3");
    const otherLink = document.getElementById("o4");
    const reportLink = document.getElementById("o5");
    const progressLink = document.getElementById("o6");
    
    const timeInput = document.getElementById("duetime");
    // Remove the default time setting
    timeInput.value = ''; // Start with empty time
    
    // Add placeholder to show it's optional
    timeInput.placeholder = '-';

    const generateNumericID = () => {
        return Date.now() + Math.floor(Math.random() * 1000);
    };

    const saveData = () => {
        const taskDescription = textInput.value;
        const dueDate = dateInput.value;
        const dueTime = timeInput.value || "-";  // Use dash if time is empty

        if (taskDescription.trim() === "" || dueDate === "") {
            showAlert({
                title: "Error",
                text: "Please fill in all required fields!",
                icon: "error",
            });
        } else {
            const id = generateNumericID();
            const task = {
                id: id,
                text: taskDescription,
                date: dueDate,
                time: dueTime,
                completed: false,
                timestamp: Date.now()
            };

            const taskData = JSON.stringify(task);
            localStorage.setItem(id, taskData);
            textInput.value = "";
            dateInput.value = new Date().toISOString().split('T')[0];
            timeInput.value = ''; // Reset time input to empty after saving
            displayTasks(currentSection);
        }
    };

    addButton.addEventListener("click", saveData);

    textInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            saveData();
        }
    });

    dateInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            saveData();
        }
    });

    // Add this new event listener for the entire document
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            const activeElement = document.activeElement;
            const isInputField = activeElement.tagName === "INPUT";
            
            if (isInputField && (
                activeElement.id === "todo" || 
                activeElement.id === "duedate" || 
                activeElement.id === "duetime"
            )) {
                event.preventDefault();
                saveData();
            }
        }
    });

    const buttonsDiv = document.querySelector(".buttons");
    buttonsDiv.addEventListener("click", () => {
        showAlert({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this data!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                const keys = Object.keys(localStorage);
                const keysToKeep = keys.filter(key => key !== "userPreferences");
                keysToKeep.forEach(key => localStorage.removeItem(key));
                taskContainer.innerHTML = "";
                showAlert({
                    title: "Success",
                    text: "All data has been deleted!",
                    icon: "success"
                });
            }
        });
    });

    const logoutLink = document.getElementById("logoutLink");

    logoutLink.addEventListener("click", () => {
        showAlert({
            title: "Are you sure?",
            text: "Logging out will delete your profile name and email.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("userPreferences");
                window.location.reload();
            }
        });
    });

    function getUserPreferences() {
        const storedPreferences = localStorage.getItem("userPreferences");
        const defaultPreferences = {
            name: "John Doe",
            email: "john@gmail.com",
        };

        return storedPreferences
            ? JSON.parse(storedPreferences)
            : defaultPreferences;
    }

    function setUserPreferences(name, email) {
        const preferences = { name, email };
        localStorage.setItem("userPreferences", JSON.stringify(preferences));
    }

    function promptForNameAndEmail() {
        Swal.fire({
            title: 'Enter your information',
            html: `
                <div class="form__group field">
                    <input type="input" class="form__field" id="swal-input-name" placeholder="Name" required>
                    <label for="swal-input-name" class="form__label">Name</label>
                </div>
                <div class="form__group field">
                    <input type="input" class="form__field" id="swal-input-email" placeholder="Email" required>
                    <label for="swal-input-email" class="form__label">Email</label>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            allowOutsideClick: false,
            allowEscapeKey: false,
            preConfirm: () => {
                const name = document.getElementById('swal-input-name').value;
                const email = document.getElementById('swal-input-email').value;
                return { name, email };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { name, email } = result.value;
                const finalName = name || "Mr John Doe";
                const finalEmail = email || "john@gmail.com";
                setUserPreferences(finalName, finalEmail);
                displayProfileData();
            }
        });
    }

    function displayProfileData() {
        const preferences = getUserPreferences();
        const nameElement = document.getElementById("name");
        const emailElement = document.getElementById("email");
        nameElement.textContent = preferences.name;
        emailElement.textContent = preferences.email;
    }

    const preferences = getUserPreferences();

    if (
        preferences.name === "John Doe" &&
        preferences.email === "john@gmail.com"
    ) {
        promptForNameAndEmail();
    }

    displayProfileData();

    const handleSectionLinkClick = (section, linkElement) => {
        displayTasks(section);
        toggleMenu();
        linkElement.removeEventListener("click", () => handleSectionLinkClick(section, linkElement));
    };

    myDayLink.addEventListener("click", function () { handleSectionLinkClick("myDay", myDayLink); });
    thisWeekLink.addEventListener("click", function () { handleSectionLinkClick("thisWeek", thisWeekLink); });
    thisMonthLink.addEventListener("click", function () { handleSectionLinkClick("thisMonth", thisMonthLink); });
    otherLink.addEventListener("click", function () { handleSectionLinkClick("other", otherLink); });
    reportLink.addEventListener("click", function () {
        generateProductivityReport();
        toggleMenu();
    });
    progressLink.addEventListener("click", function () {
        setActiveMenuItem(this);
        currentSection = 'progress'; // Add this line
        if (titleLink) titleLink.textContent = "Progress Tracking";
        displayProgressTracking();
        toggleMenu();
    });

    // Update menu item click handlers
    const menuItems = document.querySelectorAll('.menu .list ul li');
    
    const setActiveMenuItem = (clickedItem) => {
        menuItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
    };

    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            setActiveMenuItem(this);
        });
    });

    // Update existing click handlers
    myDayLink.addEventListener("click", function () { 
        setActiveMenuItem(this);
        handleSectionLinkClick("myDay", myDayLink); 
    });

    thisWeekLink.addEventListener("click", function () { 
        setActiveMenuItem(this);
        handleSectionLinkClick("thisWeek", thisWeekLink); 
    });

    thisMonthLink.addEventListener("click", function () { 
        setActiveMenuItem(this);
        handleSectionLinkClick("thisMonth", thisMonthLink); 
    });

    otherLink.addEventListener("click", function () { 
        setActiveMenuItem(this);
        handleSectionLinkClick("other", otherLink); 
    });

    reportLink.addEventListener("click", function () {
        setActiveMenuItem(this);
        generateProductivityReport();
        toggleMenu();
    });

    progressLink.addEventListener("click", function () {
        setActiveMenuItem(this);
        if (titleLink) titleLink.textContent = "Progress Tracking";
        displayProgressTracking();
        toggleMenu();
    });
        displayTasks("myDay"); // Initial display
        
        const burgerIcon = document.getElementById('burgerIcon');
        const containerLeft = document.getElementById('containerLeft');
        
        var toggleMenu = () => {
            containerLeft.classList.toggle('v-class');
            burgerIcon.classList.toggle('cross');
        };
    
        burgerIcon.addEventListener('click', toggleMenu);
    
        document.body.addEventListener('click', (event) => {
            const target = event.target;
            if (!containerLeft.contains(target) && !burgerIcon.contains(target)) {
                containerLeft.classList.remove('v-class');
                burgerIcon.classList.remove('cross');
            }
        });
    
        // Check for reminders every minute
        setInterval(checkReminders, 60000);
    
        // Check for overdue tasks every minute
        setInterval(checkOverdueTasks, 60000); // Check every minute
        checkOverdueTasks(); // Initial check
    
        // Replace the existing checkbox change event listener with this updated one
        document.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                const taskElement = e.target.closest('.card');
                const taskId = taskElement.dataset.taskId;
                const task = JSON.parse(localStorage.getItem(taskId));
                if (task) {
                    task.completed = e.target.checked;
                    localStorage.setItem(taskId, JSON.stringify(task));
                    checkOverdueTasks();
                    updateProgressTracking(); // Add this line to update charts
                }
            }
        });
    
        // Fix search functionality with null checks
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Show original section if search is empty
            if (searchTerm === '') {
                displayTasks(currentSection);
                return;
            }
            
            // Get ALL tasks from localStorage regardless of section
            const allTasks = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key !== "userPreferences") {
                    try {
                        const task = JSON.parse(localStorage.getItem(key));
                        if (task) allTasks.push(task);
                    } catch (e) {
                        console.error("Error parsing task:", e);
                    }
                }
            }
            
            // Enhanced search filtering across all tasks
            const filteredTasks = allTasks.filter(task => {
                const text = (task.text || '').toLowerCase();
                const date = (task.date || '');
                const time = (task.time || '');
                return text.includes(searchTerm) ||
                       date.includes(searchTerm) ||
                       time.includes(searchTerm);
            });
            
            // Override the section filter temporarily for search results
            if (titleLink) titleLink.textContent = `Search Results: "${searchTerm}"`;
            displayTasks('other', filteredTasks); // Use 'other' section to show all results
        });
    });
    
    function setReminder(taskId) {
        return Swal.fire({
            title: "Set Reminder",
            html: `<input type="datetime-local" id="reminderTime" value="${new Date().toISOString().slice(0, 16)}">`,
            showCancelButton: true,
            confirmButtonText: 'Set',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                return document.getElementById('reminderTime').value;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const task = JSON.parse(localStorage.getItem(taskId));
                task.reminderTime = new Date(result.value).toISOString();
                localStorage.setItem(taskId, JSON.stringify(task));
                displayTasks(currentSection);
            }
        });
    }