// Analytics functionality
class AnalyticsManager {
    constructor(app) {
        this.app = app;
        this.charts = {};
    }
    
    render() {
        const { graphMonth, tasks } = this.app.state;
        
        if (tasks.length === 0) {
            return this.renderEmptyAnalytics();
        }
        
        const graphMonthName = TrackerUtils.formatMonth(graphMonth);
        const canNavigatePrev = TrackerUtils.canNavigatePrevious(graphMonth);
        
        return `
            <div class="analytics-controls">
                <button class="analytics-button" ${!canNavigatePrev ? 'disabled' : ''} onclick="app.prevGraphMonth()">
                    ◀ PREV
                </button>
                <h3>${graphMonthName} ANALYTICS</h3>
                <button class="analytics-button" onclick="app.nextGraphMonth()">
                    NEXT ▶
                </button>
            </div>
            
            <div class="analytics-grid">
                <div>
                    <div class="chart-container">
                        <h3>📊 DAILY COMPLETION TREND</h3>
                        <div class="chart">
                            <canvas id="dailyChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h3>📈 TASK PERFORMANCE</h3>
                        <div class="chart">
                            <canvas id="taskChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="summary-section">
                    ${this.renderSummaryCards()}
                </div>
            </div>
            
            <div class="chart-container">
                <h3>✅ TASK COMPLETION RATE</h3>
                <div class="task-stats">
                    ${this.renderTaskStats()}
                </div>
            </div>
        `;
    }
    
    renderEmptyAnalytics() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2>ANALYTICS 📊</h2>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📈</div>
                    <h3 style="color: var(--accent-cyan); margin-bottom: 16px;">No Data Yet</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        Complete some tasks to see your analytics and progress charts here!
                    </p>
                    <button onclick="app.setActiveTab('tracker')" class="analytics-button">
                        Go to Tracker
                    </button>
                </div>
            </div>
        `;
    }
    
    renderSummaryCards() {
        const stats = this.calculateSummaryStats();
        
        return `
            <div class="summary-card">
                <div class="summary-label">TOTAL COMPLETED</div>
                <div class="summary-value">${stats.totalCompleted}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">TOTAL MISSED</div>
                <div class="summary-value">${stats.totalMissed}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">SUCCESS RATE</div>
                <div class="summary-value">${stats.successRate}%</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">CONSISTENCY SCORE</div>
                <div class="summary-value">${stats.consistencyScore}%</div>
            </div>
        `;
    }
    
    renderTaskStats() {
        const taskStats = this.calculateTaskStats();
        
        return taskStats.map((task, idx) => `
            <div class="task-stat-item">
                <div class="task-stat-header">
                    <span class="task-name">${task.icon} ${task.name}</span>
                    <span class="task-percentage">${task.percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${task.percentage}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: var(--text-secondary)">
                    <span>${task.completed}/${task.total} days</span>
                    <span>${task.missed} missed</span>
                </div>
            </div>
        `).join('');
    }
    
    calculateSummaryStats() {
        const { tasks, records, graphMonth } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(graphMonth);
        
        let totalCompleted = 0;
        let totalMissed = 0;
        let totalPossible = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(graphMonth.getFullYear(), graphMonth.getMonth(), day);
            
            tasks.forEach(task => {
                const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
                const cellDate = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                taskCreatedDate.setHours(0, 0, 0, 0);
                
                // Only count if task existed on this date
                if (taskCreatedDate <= cellDate) {
                    const status = this.getTaskStatus(date, task.id);
                    if (status === 'completed') {
                        totalCompleted++;
                    } else if (status === 'missed') {
                        totalMissed++;
                    }
                    totalPossible++;
                }
            });
        }
        
        const successRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        const consistencyScore = this.calculateConsistencyScore();
        
        return {
            totalCompleted,
            totalMissed,
            successRate,
            consistencyScore
        };
    }
    
    calculateTaskStats() {
        const { tasks, records, graphMonth } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(graphMonth);
        
        return tasks.map(task => {
            let completed = 0;
            let missed = 0;
            let totalDays = 0;
            
            const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(graphMonth.getFullYear(), graphMonth.getMonth(), day);
                
                const cellDate = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                taskCreatedDate.setHours(0, 0, 0, 0);
                
                // Only count if task existed on this date
                if (taskCreatedDate <= cellDate) {
                    const status = this.getTaskStatus(date, task.id);
                    if (status === 'completed') completed++;
                    else if (status === 'missed') missed++;
                    totalDays++;
                }
            }
            
            const percentage = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
            
            return {
                name: task.name,
                shortName: task.name.length > 12 ? task.name.substring(0, 10) + '...' : task.name,
                icon: task.icon || '📝',
                completed,
                missed,
                total: totalDays,
                percentage
            };
        });
    }
    
    calculateConsistencyScore() {
        const taskStats = this.calculateTaskStats();
        if (taskStats.length === 0) return 0;
        
        const totalPercentage = taskStats.reduce((sum, task) => sum + task.percentage, 0);
        return Math.round(totalPercentage / taskStats.length);
    }
    
    getTaskStatus(date, taskId) {
        const key = TrackerUtils.getDateKey(date);
        let status = this.app.state.records[key] && this.app.state.records[key][taskId] ? this.app.state.records[key][taskId] : null;
        
        // If it's yesterday and no status, consider it missed for analytics only if task existed yesterday
        if (!status && TrackerUtils.isYesterday(date, this.app.state.today)) {
            const task = this.app.state.tasks.find(t => t.id === taskId);
            if (task) {
                const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
                const yesterday = new Date(this.app.state.today);
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);
                taskCreatedDate.setHours(0, 0, 0, 0);
                
                if (taskCreatedDate <= yesterday) {
                    status = 'missed';
                }
            }
        }
        
        return status;
    }
    
    renderCharts() {
        if (this.app.state.tasks.length === 0) return;
        
        setTimeout(() => {
            this.renderDailyChart();
            this.renderTaskChart();
        }, 300);
    }
    
    renderDailyChart() {
        const ctx = document.getElementById('dailyChart');
        if (!ctx) return;
        
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }
        
        const dailyStats = this.getDailyStats();
        
        try {
            this.charts.daily = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dailyStats.map(stat => stat.day),
                    datasets: [
                        {
                            label: 'Completed Tasks',
                            data: dailyStats.map(stat => stat.completed),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: this.app.isMobile ? 3 : 4,
                            pointHoverRadius: this.app.isMobile ? 5 : 6
                        },
                        {
                            label: 'Missed Tasks',
                            data: dailyStats.map(stat => stat.missed),
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: this.app.isMobile ? 3 : 4,
                            pointHoverRadius: this.app.isMobile ? 5 : 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#cbd5e1',
                                font: {
                                    size: this.app.isMobile ? 10 : 12,
                                    weight: 'bold'
                                },
                                padding: this.app.isMobile ? 10 : 15
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#cbd5e1',
                                font: {
                                    size: this.app.isMobile ? 9 : 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#cbd5e1',
                                font: {
                                    size: this.app.isMobile ? 9 : 11
                                },
                                precision: 0
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering daily chart:', error);
        }
    }
    
    renderTaskChart() {
        const ctx = document.getElementById('taskChart');
        if (!ctx) return;
        
        if (this.charts.task) {
            this.charts.task.destroy();
        }
        
        const taskStats = this.calculateTaskStats();
        
        try {
            this.charts.task = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: taskStats.map(task => task.shortName),
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: taskStats.map(task => task.percentage),
                        backgroundColor: [
                            'rgba(0, 173, 181, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(139, 92, 246, 0.7)',
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(245, 158, 11, 0.7)',
                            'rgba(236, 72, 153, 0.7)',
                            'rgba(34, 211, 238, 0.7)',
                            'rgba(99, 102, 241, 0.7)'
                        ],
                        borderColor: [
                            'rgb(0, 173, 181)',
                            'rgb(59, 130, 246)',
                            'rgb(139, 92, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(236, 72, 153)',
                            'rgb(34, 211, 238)',
                            'rgb(99, 102, 241)'
                        ],
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#cbd5e1',
                                font: {
                                    size: this.app.isMobile ? 9 : 11
                                },
                                maxRotation: this.app.isMobile ? 45 : 45
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#cbd5e1',
                                font: {
                                    size: this.app.isMobile ? 9 : 11
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering task chart:', error);
        }
    }
    
    getDailyStats() {
        const { tasks, records, graphMonth } = this.app.state;
        const daysInMonth = TrackerUtils.getDaysInMonth(graphMonth);
        const stats = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(graphMonth.getFullYear(), graphMonth.getMonth(), day);
            let completed = 0;
            let missed = 0;
            
            tasks.forEach(task => {
                const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : new Date('2025-11-01');
                const cellDate = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                taskCreatedDate.setHours(0, 0, 0, 0);
                
                // Only count if task existed on this date
                if (taskCreatedDate <= cellDate) {
                    const status = this.getTaskStatus(date, task.id);
                    if (status === 'completed') completed++;
                    else if (status === 'missed') missed++;
                }
            });
            
            stats.push({ 
                day: `Day ${day}`,
                completed, 
                missed
            });
        }
        
        return stats;
    }
    
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    prevGraphMonth() {
        const newMonth = new Date(this.app.state.graphMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        
        if (newMonth >= new Date('2025-11-01')) {
            this.app.state.graphMonth = newMonth;
            this.app.render();
        }
    }
    
    nextGraphMonth() {
        const newMonth = new Date(this.app.state.graphMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        this.app.state.graphMonth = newMonth;
        this.app.render();
    }
}