// Tracker functionality
class TrackerManager {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const { tasks, currentMonth, today } = this.app.state;
        
        if (tasks.length === 0) {
            return this.renderEmptyState();
        }
        
        const maxDaysToShow = this.getMaxDaysToShow();
        
        return `
            <div class="card">
                <div class="card-header">
                    <h2>TASKS TRACKER</h2>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th class="task-cell">TASK</th>
                                ${this.generateDayHeaders(maxDaysToShow)}
                                <th class="day-header">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateTaskRows(maxDaysToShow)}
                        </tbody>
                    </table>
                </div>
                ${this.renderTaskForm()}
            </div>
            
            ${this.renderStatsGrid()}
            ${this.renderDataManagementSection()}
        `;
    }
    
    renderEmptyState() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2>WELCOME TO YOUR ROUTINE TRACKER! 🎉</h2>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h3 style="color: var(--accent-cyan); margin-bottom: 16px;">No Tasks Yet</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        Start by adding your first task below. Track your daily routines and build better habits!
                    </p>
                </div>
                ${this.renderTaskForm()}
            </div>
            
            ${this.renderStatsGrid()}
            ${this.renderDataManagementSection()}
        `;
    }
    
    renderStatsGrid() {
        const stats = this.calculateStats();
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">TOTAL TASKS</div>
                    <div class="stat-value">${stats.totalTasks}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">COMPLETED</div>
                    <div class="stat-value">${stats.completed}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">MISSED</div>
                    <div class="stat-value">${stats.missed}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">SUCCESS RATE</div>
                    <div class="stat-value">${stats.successRate}%</div>
                </div>
            </div>
        `;
    }

    renderTaskForm() {
        return `
            <div class="task-form">
                <h3>MANAGE TASKS</h3>
                <div class="form-row">
                    <button onclick="app.showTaskModal()" class="add-button">
                        ➕ ADD NEW TASK
                    </button>
                </div>
            </div>
        `;
    }
    
    renderDataManagementSection() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2>⚙️ Data Management</h2>
                </div>
                <div class="data-management">
                    <div class="data-management-buttons">
                        <button onclick="app.exportData()" class="add-button" style="background: var(--accent-green);">
                            📤 Export Data
                        </button>
                        <button onclick="app.importData()" class="add-button" style="background: var(--accent-blue);">
                            📥 Import Data
                        </button>
                        <button onclick="app.showResetConfirm()" class="add-button" style="background: var(--accent-red);">
                            🗑️ Reset All Data
                        </button>
                    </div>
                    <div class="data-management-note">
                        💡 Reset will permanently delete all your tasks, goals, and progress data
                    </div>
                </div>
            </div>
        `;
    }
    
    getMaxDaysToShow() {
        const { currentMonth } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(currentMonth);
        const width = this.app.windowWidth;
        
        if (width < 640) return 7;
        if (width < 768) return 10;
        if (width < 1024) return 14;
        return daysInMonth;
    }
    
    generateDayHeaders(maxDaysToShow) {
        const { currentMonth, today } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(currentMonth);
        const daysToShow = Math.min(daysInMonth, maxDaysToShow);
        
        let html = '';
        
        for (let day = 1; day <= daysToShow; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const locked = TrackerUtils.isDateLocked(date, today);
            const future = TrackerUtils.isDateInFuture(date, today);
            const isToday = TrackerUtils.canEditDate(date, today);
            const isYesterday = TrackerUtils.isYesterday(date, today);
            
            let dayClass = 'day-header';
            let indicator = '';
            
            if (locked) {
                if (isYesterday) {
                    indicator = '🔒';
                } else {
                    indicator = '🔒';
                }
            } else if (future) {
                indicator = '📜';
            } else if (isToday) {
                indicator = '⭐';
            }
            
            html += `
                <th class="${dayClass}">
                    <div>${day}</div>
                    <div>${TrackerUtils.getWeekdayLabel(date)}</div>
                    <div class="day-indicator">${indicator}</div>
                </th>
            `;
        }
        
        return html;
    }
    
    generateTaskRows(maxDaysToShow) {
        const { tasks, currentMonth } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(currentMonth);
        const daysToShow = Math.min(daysInMonth, maxDaysToShow);
        
        return tasks.map((task) => {
            const taskScore = this.calculateTaskScore(task.id);
            const isActive = this.app.state.activeTaskId === task.id;
            
            return `
                <tr>
                    <td class="task-cell ${isActive ? 'active' : ''}">
                        ${this.renderTaskDisplay(task)}
                    </td>
                    ${this.generateTaskCells(task, daysToShow)}
                    <td style="text-align: center; font-weight: bold; color: var(--accent-cyan)">
                        ${taskScore}/${daysInMonth}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderTaskDisplay(task) {
        const isActive = this.app.state.activeTaskId === task.id;
        const showActions = !this.app.isMobile || isActive;
        
        return `
            <div class="task-display-container">
                <span class="task-name-full" onclick="app.toggleTaskActions(${task.id})">
                    ${task.icon || '📝'} ${task.name}
                </span>
                ${showActions ? this.renderTaskActions(task) : ''}
            </div>
        `;
    }
    
    renderTaskActions(task) {
        if (this.app.isMobile) {
            return `
                <div class="task-actions mobile-actions">
                    <button onclick="app.showEditTaskModal(${task.id})" class="action-button edit" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button onclick="app.showDeleteConfirm(${task.id})" class="action-button delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="task-actions">
                    <button onclick="app.showEditTaskModal(${task.id})" class="action-button edit" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button onclick="app.showDeleteConfirm(${task.id})" class="action-button delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        }
    }
    
    generateTaskCells(task, daysToShow) {
        const { currentMonth, today } = this.app.state;
        let html = '';
        
        for (let day = 1; day <= daysToShow; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            let status = this.getTaskStatus(date, task.id);
            const locked = TrackerUtils.isDateLocked(date, today);
            const future = TrackerUtils.isDateInFuture(date, today);
            const isToday = TrackerUtils.canEditDate(date, today);
            const isYesterday = TrackerUtils.isYesterday(date, today);
            
            // Check if task was created on or before this date
            const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
            const cellDate = new Date(date);
            cellDate.setHours(0, 0, 0, 0);
            taskCreatedDate.setHours(0, 0, 0, 0);
            
            const taskExistedOnDate = taskCreatedDate <= cellDate;
            
            // Auto-mark yesterday's incomplete tasks as missed only if task existed yesterday
            if (isYesterday && !status && locked && taskExistedOnDate) {
                status = 'missed';
            }
            
            let buttonClass = 'status-button';
            if (status === 'completed') buttonClass += ' completed';
            else if (status === 'missed') buttonClass += ' missed';
            else buttonClass += ' pending';
            
            if (isToday && !status) {
                buttonClass += ' today-task';
            }
            
            const disabled = !TrackerUtils.canEditDate(date, today) || !taskExistedOnDate;
            const dateStr = `new Date(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})`;
            
            let buttonContent = '○';
            if (disabled) {
                if (locked) {
                    // For locked dates, show actual status only if task existed on that date
                    if (taskExistedOnDate) {
                        if (status === 'completed') {
                            buttonContent = '✓';
                            buttonClass += ' completed locked';
                        } else if (status === 'missed') {
                            buttonContent = '✕';
                            buttonClass += ' missed locked';
                        } else {
                            buttonContent = '🔒';
                            buttonClass += ' locked';
                        }
                    } else {
                        // Task didn't exist on this locked date - show lock icon
                        buttonContent = '🔒';
                        buttonClass += ' locked';
                    }
                } else if (future) {
                    buttonContent = '📜';
                    buttonClass += ' future';
                } else if (!taskExistedOnDate) {
                    // Task didn't exist on this date (but date is not locked or future) - should not happen normally
                    buttonContent = '○';
                    buttonClass += ' pending';
                }
            } else if (status === 'completed') {
                buttonContent = '✓';
            } else if (status === 'missed') {
                buttonContent = '✕';
            }
            
            html += `
                <td>
                    <button 
                        onclick="app.toggleTaskStatus(${dateStr}, ${task.id})"
                        oncontextmenu="event.preventDefault(); app.markMissed(${dateStr}, ${task.id})"
                        ${disabled ? 'disabled' : ''}
                        class="${buttonClass}"
                        title="${this.getButtonTitle(date, status, locked, future, isYesterday, taskExistedOnDate)}"
                    >
                        ${buttonContent}
                    </button>
                </td>
            `;
        }
        
        return html;
    }
    
    getButtonTitle(date, status, locked, future, isYesterday, taskExistedOnDate) {
        if (!taskExistedOnDate) {
            return 'Task not created on this date';
        }
        if (locked) {
            if (isYesterday && !status) {
                return 'Yesterday - Automatically marked as missed';
            }
            return 'Past date - cannot edit';
        }
        if (future) return 'Future date';
        if (status === 'completed') return 'Click to mark as pending\nRight-click to mark as missed';
        if (status === 'missed') return 'Click to mark as completed\nRight-click to mark as pending';
        return 'Click to mark as completed\nRight-click to mark as missed';
    }
    
    getTaskStatus(date, taskId) {
        const key = TrackerUtils.getDateKey(date);
        return this.app.state.records[key]?.[taskId] || null;
    }
    
    calculateTaskScore(taskId) {
        const { currentMonth, tasks } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(currentMonth);
        let score = 0;
        
        const task = tasks.find(t => t.id === taskId);
        const taskCreatedDate = task?.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            
            // Check if task existed on this date
            const cellDate = new Date(date);
            cellDate.setHours(0, 0, 0, 0);
            taskCreatedDate.setHours(0, 0, 0, 0);
            
            if (taskCreatedDate <= cellDate) {
                let status = this.getTaskStatus(date, taskId);
                
                // Count yesterday's auto-missed tasks in score only if task existed yesterday
                if (!status && TrackerUtils.isYesterday(date, this.app.state.today) && taskCreatedDate <= cellDate) {
                    status = 'missed';
                }
                
                if (status === 'completed') {
                    score++;
                }
            }
        }
        return score;
    }
    
    calculateStats() {
        const { tasks, records, currentMonth, today } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(currentMonth);
        
        let completed = 0;
        let missed = 0;
        let totalPossible = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const key = TrackerUtils.getDateKey(date);
            const isYesterday = TrackerUtils.isYesterday(date, today);
            
            tasks.forEach(task => {
                const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
                const cellDate = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                taskCreatedDate.setHours(0, 0, 0, 0);
                
                // Only count if task existed on this date
                if (taskCreatedDate <= cellDate) {
                    let status = records[key] && records[key][task.id] ? records[key][task.id] : null;
                    
                    // Count yesterday's incomplete tasks as missed only if task existed yesterday
                    if (!status && isYesterday) {
                        status = 'missed';
                    }
                    
                    if (status === 'completed') {
                        completed++;
                    } else if (status === 'missed') {
                        missed++;
                    }
                    
                    totalPossible++;
                }
            });
        }
        
        const successRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
        
        return {
            totalTasks: tasks.length,
            completed,
            missed,
            successRate
        };
    }
}