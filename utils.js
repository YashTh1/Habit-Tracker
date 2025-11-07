// Utility functions
class TrackerUtils {
    static getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
    
    static getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    static isDateLocked(date, today) {
        const compare1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const compare2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return compare1 < compare2;
    }
    
    static isDateInFuture(date, today) {
        const compare1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const compare2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return compare1 > compare2;
    }
    
    static canEditDate(date, today) {
        const compare1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const compare2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return compare1.getTime() === compare2.getTime();
    }
    
    static canNavigatePrevious(date) {
        const compare = new Date(date.getFullYear(), date.getMonth(), 1);
        return compare > new Date('2025-11-01');
    }
    
    static formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    static formatMonth(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    static getWeekdayLabel(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // NEW: Check if date is yesterday
    static isYesterday(date, today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() && 
               date.getMonth() === yesterday.getMonth() && 
               date.getFullYear() === yesterday.getFullYear();
    }
    
    // NEW: Check if we should auto-mark as missed (yesterday and not completed)
    static shouldAutoMarkMissed(date, today, status) {
        return this.isYesterday(date, today) && !status;
    }
}
