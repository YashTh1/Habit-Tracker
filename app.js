// Main application
class DailyRoutineTracker {
    constructor() {
        this.state = {
            currentMonth: new Date('2025-11-01'),
            graphMonth: new Date('2025-11-01'),
            today: new Date(),
            currentTime: new Date(),
            tasks: [],
            records: {},
            goals: [],
            streak: 0,
            highestStreak: 0,
            editingTask: null,
            editName: '',
            newTaskName: '',
            activeTab: 'tracker',
            deleteConfirmId: null,
            deleteGoalConfirmIndex: null,
            lastStreakUpdate: null,
            activeTaskId: null,
            lastAutoMarkDate: null,
            editingTaskId: null
        };
        
        this.windowWidth = window.innerWidth;
        this.isMobile = this.windowWidth <= 768;
        this.trackerManager = new TrackerManager(this);
        this.analyticsManager = new AnalyticsManager(this);
        this.goalsManager = new GoalsManager(this);
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Daily Routine Tracker...');
        
        this.showLoading();
        
        setTimeout(() => {
            try {
                this.loadData();
                this.setupEventListeners();
                this.autoMarkMissedTasks();
                this.render();
                
                this.updateTime();
                setInterval(() => this.updateTime(), 1000);
                setInterval(() => this.saveData(), 30000);
                setInterval(() => {
                    this.updateStreak();
                    this.checkGoalExpiration();
                    this.autoMarkMissedTasks();
                }, 60000);
                
                this.isInitialized = true;
                console.log('✅ Daily Routine Tracker initialized successfully');
            } catch (error) {
                console.error('❌ Initialization failed:', error);
                this.showErrorState();
            }
        }, 500);
    }
    
    showLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading your routine tracker...</p>
                </div>
            `;
        }
    }
    
    showErrorState() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <h2 style="color: var(--accent-red); margin-bottom: 20px;">💥 Application Error</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        The application failed to load. Please refresh the page.
                    </p>
                    <button onclick="window.location.reload()" class="add-button">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
        }
    }
    
    loadData() {
        console.log('📥 Loading data from storage...');
        
        try {
            const savedTasks = StorageManager.loadTasks();
            const savedRecords = StorageManager.loadRecords();
            const savedGoals = StorageManager.loadGoals();
            const savedStreak = StorageManager.loadStreak();
            const savedHighestStreak = StorageManager.loadHighestStreak();
            const savedLastStreakUpdate = StorageManager.loadLastStreakUpdate();
            
            // Load tasks from storage - don't set defaults if empty
            if (savedTasks) {
                this.state.tasks = savedTasks;
            } else {
                this.state.tasks = []; // Empty array instead of default tasks
            }
            
            // Load other data
            if (savedRecords) this.state.records = savedRecords;
            if (savedGoals) this.state.goals = savedGoals;
            if (savedStreak !== undefined && savedStreak !== null) this.state.streak = savedStreak;
            if (savedHighestStreak !== undefined && savedHighestStreak !== null) this.state.highestStreak = savedHighestStreak;
            if (savedLastStreakUpdate) this.state.lastStreakUpdate = savedLastStreakUpdate;
            
            // Load auto-mark date
            const savedLastAutoMarkDate = localStorage.getItem('lastAutoMarkDate');
            if (savedLastAutoMarkDate) {
                this.state.lastAutoMarkDate = savedLastAutoMarkDate;
            }
            
            this.checkGoalExpiration();
            
            console.log(`✅ Data loaded: ${this.state.tasks.length} tasks, ${Object.keys(this.state.records).length} records, ${this.state.goals.length} goals`);
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.state.tasks = []; // Empty array on error instead of defaults
        }
    }
    
    autoMarkMissedTasks() {
        const { tasks, records, today } = this.state;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayKey = this.getDateKey(yesterday);
        if (this.state.lastAutoMarkDate === yesterdayKey) {
            return;
        }
        
        let hasChanges = false;
        
        // Only mark tasks that existed yesterday as missed
        tasks.forEach(task => {
            // Check if task was created before yesterday
            const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01'); // Default to app start date for existing tasks
            if (taskCreatedDate <= yesterday) {
                const status = this.getTaskStatus(yesterday, task.id);
                if (!status) {
                    this.setTaskStatus(yesterdayKey, task.id, 'missed');
                    hasChanges = true;
                }
            }
        });
        
        if (hasChanges) {
            this.state.lastAutoMarkDate = yesterdayKey;
            this.saveData();
            this.render();
            console.log('✅ Auto-marked yesterday\'s incomplete tasks as missed');
        }
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        window.addEventListener('resize', () => {
            this.windowWidth = window.innerWidth;
            this.isMobile = this.windowWidth <= 768;
            this.render();
        });
        
        this.setupModalListeners();
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'goal-type-select') {
                this.updateGoalExpiryInfo();
            }
        });
        
        window.addEventListener('beforeunload', () => this.saveData());
        
        window.addEventListener('online', () => {
            this.showNotification('Back online - data saving restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline - data will be saved locally', 'warning');
        });
        
        document.addEventListener('click', (e) => {
            if (this.isMobile && this.state.activeTaskId && !e.target.closest('.task-cell')) {
                this.state.activeTaskId = null;
                this.render();
            }
        });
    }
    
    setupModalListeners() {
        // Modal button listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'modal-cancel') {
                this.hideDeleteConfirm();
            } else if (e.target.id === 'modal-confirm') {
                this.confirmDelete();
            } else if (e.target.id === 'goal-modal-cancel') {
                this.hideGoalModal();
            } else if (e.target.id === 'goal-modal-confirm') {
                this.addGoalFromModal();
            } else if (e.target.id === 'task-modal-cancel') {
                this.hideTaskModal();
            } else if (e.target.id === 'task-modal-confirm') {
                this.addTaskFromModal();
            } else if (e.target.id === 'edit-task-modal-cancel') {
                this.hideEditTaskModal();
            } else if (e.target.id === 'edit-task-modal-confirm') {
                this.saveEditTaskFromModal();
            }
        });
        
        // Modal overlay listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.hideDeleteConfirm();
            } else if (e.target.id === 'goal-modal-overlay') {
                this.hideGoalModal();
            } else if (e.target.id === 'task-modal-overlay') {
                this.hideTaskModal();
            } else if (e.target.id === 'edit-task-modal-overlay') {
                this.hideEditTaskModal();
            }
        });
        
        // Enter key support for modals
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.getElementById('task-modal-overlay')?.style.display === 'flex') {
                    this.addTaskFromModal();
                } else if (document.getElementById('edit-task-modal-overlay')?.style.display === 'flex') {
                    this.saveEditTaskFromModal();
                } else if (document.getElementById('goal-modal-overlay')?.style.display === 'flex') {
                    this.addGoalFromModal();
                }
            }
        });
    }
    
    updateTime() {
        const now = new Date();
        this.state.today = now;
        this.state.currentTime = now;
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        const timeElement = document.querySelector('.time');
        if (timeElement) {
            timeElement.textContent = this.state.currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
    
    saveData() {
        if (!this.isInitialized) return;
        
        try {
            StorageManager.saveTasks(this.state.tasks);
            StorageManager.saveRecords(this.state.records);
            StorageManager.saveGoals(this.state.goals);
            StorageManager.saveStreak(this.state.streak);
            StorageManager.saveHighestStreak(this.state.highestStreak);
            StorageManager.saveLastStreakUpdate(this.state.lastStreakUpdate);
            
            if (this.state.lastAutoMarkDate) {
                localStorage.setItem('lastAutoMarkDate', this.state.lastAutoMarkDate);
            }
            
            console.log('💾 Data saved successfully');
        } catch (error) {
            console.error('❌ Error saving data:', error);
        }
    }
    
    // app.js में render method में थोड़ा सा change
render() {
    const app = document.getElementById('app');
    if (!app) {
        console.error('❌ App container not found');
        return;
    }
    
    try {
        app.innerHTML = this.renderHeader() + this.renderTabs() + this.renderContent();
        this.updateTimeDisplay();
        
        // Mobile के लिए scroll hint add करें
        if (this.isMobile && this.state.activeTab === 'tracker' && this.state.tasks.length > 0) {
            this.addMobileScrollHint();
        }
        
        if (this.state.activeTab === 'analytics') {
            setTimeout(() => {
                this.analyticsManager.renderCharts();
            }, 100);
        }
        
        console.log('🔄 App rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering app:', error);
        this.showErrorState();
    }
}

// New method for mobile scroll hint
addMobileScrollHint() {
    const tableContainer = document.querySelector('.table-container.mobile-scrollable');
    if (tableContainer) {
        // Auto-scroll to today's date on mobile
        setTimeout(() => {
            this.scrollToToday();
        }, 500);
    }
}

// Today's date पर auto-scroll करें
scrollToToday() {
    if (!this.isMobile) return;
    
    const tableContainer = document.querySelector('.table-container.mobile-scrollable');
    if (!tableContainer) return;
    
    const today = new Date();
    const currentMonth = this.state.currentMonth;
    
    if (today.getMonth() === currentMonth.getMonth() && 
        today.getFullYear() === currentMonth.getFullYear()) {
        
        const day = today.getDate();
        const dayElement = document.querySelector(`th.day-header:nth-child(${day + 1})`);
        
        if (dayElement) {
            const scrollPosition = dayElement.offsetLeft - 100; // थोड़ा left margin
            tableContainer.scrollLeft = Math.max(0, scrollPosition);
        }
    }
}

    renderHeader() {
        const monthName = this.state.currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        const canNavigatePrev = this.state.currentMonth > new Date('2025-11-01');
        
        return `
            <div class="header">
                <div class="header-top">
                    <button class="nav-button" ${!canNavigatePrev ? 'disabled' : ''} onclick="app.handleNavButtonClick(event, 'prev')">◀</button>
                    <h1>DAILY ROUTINE TRACKER</h1>
                    <button class="nav-button" onclick="app.handleNavButtonClick(event, 'next')">▶</button>
                </div>
                <div class="header-info">
                    <div>
                        <p>Today</p>
                        <p style="font-weight: bold">${this.state.today.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}</p>
                    </div>
                    <div style="text-align: center">
                        <p>Month</p>
                        <p style="font-weight: bold">${monthName}</p>
                    </div>
                    <div class="time-display">
                        <p class="time">${this.state.currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}</p>
                        <p>Local Time</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    handleNavButtonClick(event, direction) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        this.removeFocusFromInputs();
        
        if (direction === 'prev') {
            this.prevMonth();
        } else if (direction === 'next') {
            this.nextMonth();
        }
    }
    
    removeFocusFromInputs() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
    
    renderTabs() {
        return `
            <div class="tab-buttons">
                <button class="tab-button tracker ${this.state.activeTab === 'tracker' ? 'active' : ''}" onclick="app.setActiveTab('tracker')">
                    📊 TRACKER
                </button>
                <button class="tab-button analytics ${this.state.activeTab === 'analytics' ? 'active' : ''}" onclick="app.setActiveTab('analytics')">
                    📈 ANALYTICS
                </button>
                <button class="tab-button goals ${this.state.activeTab === 'goals' ? 'active' : ''}" onclick="app.setActiveTab('goals')">
                    🎯 GOALS
                </button>
            </div>
        `;
    }
    
    renderContent() {
        switch (this.state.activeTab) {
            case 'tracker':
                return this.trackerManager.render();
            case 'analytics':
                return this.analyticsManager.render();
            case 'goals':
                return this.goalsManager.render();
            default:
                return this.trackerManager.render();
        }
    }
    
    prevMonth() {
        const newMonth = new Date(this.state.currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        
        if (newMonth >= new Date('2025-11-01')) {
            this.state.currentMonth = newMonth;
            this.render();
        }
    }
    
    nextMonth() {
        const newMonth = new Date(this.state.currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        this.state.currentMonth = newMonth;
        this.render();
    }
    
    prevGraphMonth() {
        const newMonth = new Date(this.state.graphMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        
        if (newMonth >= new Date('2025-11-01')) {
            this.state.graphMonth = newMonth;
            this.render();
        }
    }
    
    nextGraphMonth() {
        const newMonth = new Date(this.state.graphMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        this.state.graphMonth = newMonth;
        this.render();
    }
    
    setActiveTab(tab) {
        if (this.state.activeTab === tab) return;
        
        if (this.state.activeTab === 'analytics') {
            this.analyticsManager.destroyCharts();
        }
        
        this.state.activeTab = tab;
        this.render();
    }
    
    // Task Modal Methods
    showTaskModal() {
        this.showModal('task-modal-overlay');
        const nameInput = document.getElementById('task-name-input');
        const iconSelect = document.getElementById('task-icon-select');
        
        if (nameInput) {
            nameInput.value = '';
            setTimeout(() => nameInput.focus(), 100);
        }
        if (iconSelect) iconSelect.value = '📝';
    }
    
    hideTaskModal() {
        this.hideModal('task-modal-overlay');
    }
    
    addTaskFromModal() {
        const nameInput = document.getElementById('task-name-input');
        const iconSelect = document.getElementById('task-icon-select');
        
        if (!nameInput || !iconSelect) return;
        
        const name = nameInput.value.trim();
        const icon = iconSelect.value;
        
        if (!name) {
            this.showNotification('Please enter a task name', 'warning');
            nameInput.focus();
            return;
        }
        
        const newTask = {
            id: Date.now(),
            name: name,
            icon: icon,
            createdAt: new Date().toISOString() // Add creation timestamp
        };
        
        this.state.tasks.push(newTask);
        this.saveData();
        this.hideTaskModal();
        this.render();
        
        this.showNotification('Task added successfully!', 'success');
    }
    
    // Edit Task Modal Methods
    showEditTaskModal(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.state.editingTaskId = taskId;
        this.showModal('edit-task-modal-overlay');
        
        const nameInput = document.getElementById('edit-task-name-input');
        const iconSelect = document.getElementById('edit-task-icon-select');
        
        if (nameInput) {
            nameInput.value = task.name;
            setTimeout(() => nameInput.focus(), 100);
        }
        if (iconSelect) iconSelect.value = task.icon || '📝';
    }
    
    hideEditTaskModal() {
        this.state.editingTaskId = null;
        this.hideModal('edit-task-modal-overlay');
    }
    
    saveEditTaskFromModal() {
        if (!this.state.editingTaskId) return;
        
        const nameInput = document.getElementById('edit-task-name-input');
        const iconSelect = document.getElementById('edit-task-icon-select');
        
        if (!nameInput || !iconSelect) return;
        
        const name = nameInput.value.trim();
        const icon = iconSelect.value;
        
        if (!name) {
            this.showNotification('Task name cannot be empty', 'warning');
            nameInput.focus();
            return;
        }
        
        const task = this.state.tasks.find(t => t.id === this.state.editingTaskId);
        if (task) {
            task.name = name;
            task.icon = icon;
            this.saveData();
            this.hideEditTaskModal();
            this.render();
            
            this.showNotification('Task updated successfully!', 'success');
        }
    }
    
    toggleTaskActions(taskId) {
        if (!this.isMobile) return;
        
        if (this.state.activeTaskId === taskId) {
            this.state.activeTaskId = null;
        } else {
            this.state.activeTaskId = taskId;
        }
        this.render();
    }
    
    // Delete Methods
    showDeleteConfirm(taskId) {
        this.state.deleteConfirmId = taskId;
        this.showModal('modal-overlay');
        
        const task = this.state.tasks.find(t => t.id === taskId);
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage && task) {
            modalMessage.innerHTML = `Are you sure you want to delete <strong>"${task.name}"</strong>? This action cannot be undone.`;
        }
    }
    
    hideDeleteConfirm() {
        this.state.deleteConfirmId = null;
        this.hideModal('modal-overlay');
    }
    
    confirmDelete() {
        if (this.state.deleteConfirmId) {
            this.deleteTask(this.state.deleteConfirmId);
            this.hideDeleteConfirm();
        }
    }
    
    deleteTask(taskId) {
        const taskIndex = this.state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const taskName = this.state.tasks[taskIndex].name;
        this.state.tasks.splice(taskIndex, 1);
        
        // Remove all records for this task
        for (const date in this.state.records) {
            if (this.state.records[date][taskId]) {
                delete this.state.records[date][taskId];
            }
            // Remove empty date entries
            if (Object.keys(this.state.records[date]).length === 0) {
                delete this.state.records[date];
            }
        }
        
        this.saveData();
        this.render();
        
        this.showNotification(`"${taskName}" permanently deleted!`, 'success');
    }
    
    // Task Status Methods
    toggleTaskStatus(date, taskId) {
        if (!this.canEditDate(date)) {
            this.showNotification('You can only edit tasks for today!', 'warning');
            return;
        }
        
        const dateKey = this.getDateKey(date);
        const currentStatus = this.getTaskStatus(date, taskId);
        const newStatus = currentStatus === 'completed' ? null : 'completed';
        
        this.setTaskStatus(dateKey, taskId, newStatus);
        
        if (newStatus === 'completed') {
            this.showNotification('Task marked as completed! ✅', 'success');
        }
    }
    
    markMissed(date, taskId) {
        if (!this.canEditDate(date)) {
            this.showNotification('You can only edit tasks for today!', 'warning');
            return;
        }
        
        const dateKey = this.getDateKey(date);
        const currentStatus = this.getTaskStatus(date, taskId);
        const newStatus = currentStatus === 'missed' ? null : 'missed';
        
        this.setTaskStatus(dateKey, taskId, newStatus);
        
        if (newStatus === 'missed') {
            this.showNotification('Task marked as missed ❌', 'warning');
        }
    }
    
    setTaskStatus(dateKey, taskId, status) {
        if (!this.state.records[dateKey]) {
            this.state.records[dateKey] = {};
        }
        
        this.state.records[dateKey][taskId] = status;
        this.saveData();
        this.render();
    }
    
    getTaskStatus(date, taskId) {
        const dateKey = this.getDateKey(date);
        return this.state.records[dateKey]?.[taskId] || null;
    }
    
    canEditDate(date) {
        const todayKey = this.getDateKey(this.state.today);
        const dateKey = this.getDateKey(date);
        return dateKey === todayKey;
    }
    
    getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Goal Methods
    showGoalModal() {
        this.showModal('goal-modal-overlay');
    }
    
    hideGoalModal() {
        this.hideModal('goal-modal-overlay');
        const nameInput = document.getElementById('goal-name-input');
        const tokensInput = document.getElementById('goal-tokens-input');
        const typeSelect = document.getElementById('goal-type-select');
        
        if (nameInput) nameInput.value = '';
        if (tokensInput) tokensInput.value = '';
        if (typeSelect) typeSelect.value = 'next-day';
        
        this.updateGoalExpiryInfo();
    }
    
    updateGoalExpiryInfo() {
        const typeSelect = document.getElementById('goal-type-select');
        const expiryInfo = document.getElementById('goal-expiry-info');
        
        if (typeSelect && expiryInfo) {
            const selectedType = typeSelect.value;
            let infoText = '';
            
            switch (selectedType) {
                case 'next-day':
                    infoText = '⏰ This goal will expire in 24 hours';
                    break;
                case 'weekly':
                    infoText = '📅 This goal will expire in 7 days';
                    break;
                case 'monthly':
                    infoText = '📅 This goal will expire in 1 month';
                    break;
                case 'yearly':
                    infoText = '📅 This goal will expire in 1 year';
                    break;
            }
            
            expiryInfo.textContent = infoText;
        }
    }
    
    addGoalFromModal() {
        const nameInput = document.getElementById('goal-name-input');
        const tokensInput = document.getElementById('goal-tokens-input');
        const typeSelect = document.getElementById('goal-type-select');
        
        if (!nameInput || !tokensInput || !typeSelect) return;
        
        const name = nameInput.value.trim();
        const tokens = parseInt(tokensInput.value);
        const type = typeSelect.value;
        
        if (!name || isNaN(tokens) || tokens <= 0) {
            this.showNotification('Please enter valid goal details!', 'warning');
            return;
        }
        
        const now = new Date();
        const createdDate = new Date(now);
        let expiryDate = new Date(createdDate);
        
        switch (type) {
            case 'next-day':
                expiryDate.setDate(createdDate.getDate() + 1);
                break;
            case 'weekly':
                expiryDate.setDate(createdDate.getDate() + 7);
                break;
            case 'monthly':
                expiryDate.setMonth(createdDate.getMonth() + 1);
                break;
            case 'yearly':
                expiryDate.setFullYear(createdDate.getFullYear() + 1);
                break;
        }
        
        const timeLeftMs = expiryDate - now;
        let timeLeftDisplay = '';
        
        if (type === 'next-day') {
            const hoursLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60)));
            timeLeftDisplay = hoursLeft > 0 ? `${hoursLeft} hours` : 'Expired';
        } else {
            const daysLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)));
            timeLeftDisplay = daysLeft > 0 ? `${daysLeft} days` : 'Expired';
        }
        
        const newGoal = {
            id: Date.now(),
            name,
            targetTokens: tokens,
            currentTokens: 0,
            type,
            status: 'active',
            createdAt: now.toISOString(),
            expiryDate: expiryDate.toISOString(),
            daysLeft: timeLeftDisplay,
            completedAt: null
        };
        
        this.state.goals.push(newGoal);
        this.saveData();
        this.hideGoalModal();
        this.render();
        
        this.showNotification('Goal added successfully!', 'success');
    }
    
    incrementGoal(goalIndex) {
        if (this.state.goals[goalIndex] && this.state.goals[goalIndex].status === 'active') {
            this.state.goals[goalIndex].currentTokens++;
            this.saveData();
            this.render();
            this.showNotification('Token added! 🎯', 'success');
        }
    }
    
    completeGoal(goalIndex) {
        if (this.state.goals[goalIndex] && this.state.goals[goalIndex].status === 'active') {
            const goal = this.state.goals[goalIndex];
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
            this.saveData();
            this.render();
            
            this.showNotification(`🎉 Goal "${goal.name}" completed! Amazing work!`, 'success');
        }
    }
    
    showDeleteGoalConfirm(index) {
        const goal = this.state.goals[index];
        if (goal && goal.status === 'active') {
            if (confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
                this.deleteGoal(index);
            }
        }
    }
    
    deleteGoal(index) {
        if (this.state.goals[index] && this.state.goals[index].status === 'active') {
            const goalName = this.state.goals[index].name;
            this.state.goals.splice(index, 1);
            this.saveData();
            this.render();
            this.showNotification(`"${goalName}" goal permanently deleted!`, 'success');
        }
    }
    
    // Streak Methods
    updateStreak() {
        const today = new Date();
        const todayKey = this.getDateKey(today);
        
        const completedToday = this.state.records[todayKey] ? 
            Object.values(this.state.records[todayKey]).filter(status => status === 'completed').length : 0;
        
        const todayDateString = today.toDateString();
        
        if (this.state.lastStreakUpdate === todayDateString) {
            return;
        }
        
        if (completedToday > 0) {
            this.state.streak++;
            this.state.lastStreakUpdate = todayDateString;
            
            if (this.state.streak > this.state.highestStreak) {
                this.state.highestStreak = this.state.streak;
            }
            
            this.saveData();
        } else {
            if (this.state.lastStreakUpdate !== todayDateString) {
                this.state.streak = 0;
                this.state.lastStreakUpdate = todayDateString;
                this.saveData();
            }
        }
    }
    
    checkGoalExpiration() {
        const now = new Date();
        let hasChanges = false;
        
        this.state.goals.forEach((goal) => {
            if (goal.status === 'active') {
                const expiryDate = new Date(goal.expiryDate);
                
                if (now >= expiryDate) {
                    goal.status = 'expired';
                    hasChanges = true;
                }
                
                const timeLeftMs = expiryDate - now;
                
                if (goal.type === 'next-day') {
                    const hoursLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60)));
                    goal.daysLeft = hoursLeft > 0 ? `${hoursLeft} hours` : 'Expired';
                } else {
                    const daysLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)));
                    goal.daysLeft = daysLeft > 0 ? `${daysLeft} days` : 'Expired';
                }
            }
        });
        
        if (hasChanges) {
            this.saveData();
        }
    }
    
    // Data Management Methods
    showResetConfirm() {
        if (confirm(`🚨 ARE YOU SURE?\n\nThis will PERMANENTLY delete ALL your data including:\n• All tasks and their history\n• All goals and progress\n• All completion records\n• Your current streak\n\nThis action cannot be undone!`)) {
            this.resetAllData();
        }
    }
    
    resetAllData() {
        StorageManager.resetApp();
        this.state.tasks = [];
        this.state.records = {};
        this.state.goals = [];
        this.state.streak = 0;
        this.state.highestStreak = 0;
        this.state.lastStreakUpdate = null;
        this.state.lastAutoMarkDate = null;
        
        this.saveData();
        this.render();
        
        this.showNotification('All data has been reset!', 'success');
    }
    
    exportData() {
        const data = StorageManager.exportAllData();
        if (data) {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `routine-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully!', 'success');
        } else {
            this.showNotification('Failed to export data', 'error');
        }
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (StorageManager.importAllData(data)) {
                        // Reload all data from storage
                        this.loadData();
                        this.render();
                        this.showNotification('Data imported successfully!', 'success');
                    } else {
                        this.showNotification('Failed to import data', 'error');
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    this.showNotification('Invalid data file', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Utility Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    showNotification(message, type = 'info') {
        // Remove any existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    destroy() {
        this.analyticsManager.destroyCharts();
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Starting application...');
    
    try {
        if (!StorageManager.isStorageAvailable()) {
            alert('Warning: Local storage is not available. Your data will not be saved.');
        }
        
        app = new DailyRoutineTracker();
        window.app = app;
        
        window.addEventListener('beforeunload', function() {
            if (app) {
                app.saveData();
            }
        });
        
        console.log('🎉 Application started successfully');
        
    } catch (error) {
        console.error('💥 Failed to initialize application:', error);
        
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <h2 style="color: var(--accent-red); margin-bottom: 20px;">💥 Application Error</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        The application failed to load. Please refresh the page or check the console for details.
                    </p>
                    <button onclick="window.location.reload()" class="add-button" style="margin: 10px;">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
        }
    }
});

// Global error handlers
window.addEventListener('error', function(event) {
    console.error('🌍 Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🔮 Unhandled promise rejection:', event.reason);
});
