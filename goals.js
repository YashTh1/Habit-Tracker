// Goals functionality
class GoalsManager {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const { goals, streak, highestStreak } = this.app.state;
        
        return `
            <div class="card">
                <div class="card-header">
                    <h2>🎯 Goals & Streaks</h2>
                </div>
                <div class="goals-container">
                    <div class="form-row">
                        <button onclick="app.showGoalModal()" class="add-button">
                            ADD NEW GOAL
                        </button>
                    </div>
                    
                    <div id="goals-list">
                        ${goals.length > 0 ? this.renderGoalsList() : this.renderEmptyState()}
                    </div>
                    
                    ${this.renderStreakSection(streak, highestStreak)}
                </div>
            </div>
        `;
    }
    
    renderGoalsList() {
        const { goals } = this.app.state;
        
        // Separate active and expired/completed goals
        const activeGoals = goals.filter(goal => goal.status === 'active');
        const otherGoals = goals.filter(goal => goal.status !== 'active');
        
        let html = '';
        
        // Render active goals first
        if (activeGoals.length > 0) {
            html += '<div class="goals-section"><h4>🎯 Active Goals</h4>';
            html += activeGoals.map((goal, index) => {
                const originalIndex = goals.findIndex(g => g.id === goal.id);
                return this.renderGoalItem(goal, originalIndex);
            }).join('');
            html += '</div>';
        }
        
        // Render completed/expired goals
        if (otherGoals.length > 0) {
            html += '<div class="goals-section" style="margin-top: 20px;"><h4>📁 Goal History</h4>';
            html += otherGoals.map((goal, index) => {
                const originalIndex = goals.findIndex(g => g.id === goal.id);
                return this.renderGoalItem(goal, originalIndex);
            }).join('');
            html += '</div>';
        }
        
        return html;
    }

    renderGoalItem(goal, index) {
        const progressPercent = Math.min((goal.currentTokens / goal.targetTokens) * 100, 100);
        const isCompleted = goal.status === 'completed';
        const isExpired = goal.status === 'expired';
        const isActive = goal.status === 'active';
        
        let statusBadge = '';
        let statusClass = '';
        let timeLeftText = '';
        
        if (isCompleted) {
            statusBadge = '<span class="goal-status completed">✅ Completed</span>';
            statusClass = 'goal-completed';
        } else if (isExpired) {
            statusBadge = '<span class="goal-status expired">⏰ Expired</span>';
            statusClass = 'goal-expired';
        } else {
            // Show appropriate time unit based on goal type
            if (goal.type === 'next-day') {
                timeLeftText = goal.daysLeft.includes('hours') ? goal.daysLeft : `${goal.daysLeft} hours`;
            } else {
                timeLeftText = goal.daysLeft.includes('days') ? goal.daysLeft : `${goal.daysLeft} days`;
            }
            statusBadge = `<span class="goal-status active">⏳ ${timeLeftText} left</span>`;
        }
        
        // Show delete button only for active goals
        const deleteButton = isActive ? 
            `<button onclick="app.showDeleteGoalConfirm(${index})" class="modal-button delete" style="padding: 8px 16px; font-size: 14px;">
                Delete
            </button>` : '';
        
        // Format goal type for display
        const goalTypeDisplay = {
            'next-day': 'Next Day',
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'yearly': 'Yearly'
        }[goal.type] || goal.type;
        
        return `
            <div class="goal-item ${statusClass}">
                <div class="goal-header">
                    <div class="goal-title">${goal.name}</div>
                    <div class="goal-meta">
                        ${goalTypeDisplay} • ${goal.targetTokens} tokens
                        ${statusBadge}
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="goal-stats">
                    <span>Progress: ${goal.currentTokens}/${goal.targetTokens}</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${isActive ? `
                        <button onclick="app.incrementGoal(${index})" class="add-button" style="padding: 8px 16px; font-size: 14px;">
                            +1 Token
                        </button>
                        ${goal.currentTokens >= goal.targetTokens ? `
                            <button onclick="app.completeGoal(${index})" class="add-button" style="padding: 8px 16px; font-size: 14px; background: var(--accent-green);">
                                🎉 Complete Goal
                            </button>
                        ` : ''}
                        ${deleteButton}
                    ` : `
                        <div style="color: var(--text-secondary); font-size: 14px; padding: 8px 0;">
                            ${isCompleted ? 'Goal completed successfully! 🎉' : 'Goal expired'}
                        </div>
                    `}
                </div>
                ${isCompleted && goal.completedAt ? `
                    <div style="margin-top: 8px; color: var(--accent-green); font-size: 12px;">
                        Completed on ${new Date(goal.completedAt).toLocaleDateString()}
                    </div>
                ` : ''}
                ${isExpired ? `
                    <div style="margin-top: 8px; color: var(--accent-red); font-size: 12px;">
                        ${goal.type === 'next-day' ? 'Expired - 24 hours time limit reached!' : 'Expired - Goal was not completed in time!'}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderStreakSection(streak, highestStreak) {
        return `
            <div class="streak-container">
                <h3>🔥 Streak Stats</h3>
                <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                    <div style="text-align: center;">
                        <div class="streak-count" style="font-size: 36px;">${streak}</div>
                        <div class="streak-label">Current Streak</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="streak-count" style="font-size: 36px; color: var(--accent-yellow);">${highestStreak}</div>
                        <div class="streak-label">Highest Streak</div>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(streak * 10, 100)}%"></div>
                    </div>
                </div>
                <div style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
                    ${this.getStreakMessage(streak)}
                </div>
                <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                    💡 Complete tasks daily to maintain your streak!
                </div>
            </div>
        `;
    }
    
    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                <h3 style="color: var(--accent-cyan); margin-bottom: 12px;">No Goals Yet</h3>
                <p>Set your first goal to start tracking your progress with tokens!</p>
            </div>
        `;
    }
    
    getStreakMessage(streak) {
        if (streak === 0) return "Start building your streak today!";
        if (streak === 1) return "Great start! Keep going!";
        if (streak < 7) return "You're building a habit!";
        if (streak < 30) return "Amazing consistency!";
        return "Incredible dedication! 🎉";
    }
}
