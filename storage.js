// Storage and data management utilities
class StorageManager {
    static STORAGE_KEYS = {
        TASKS: 'daily_routine_tasks',
        RECORDS: 'daily_routine_records',
        GOALS: 'daily_routine_goals',
        STREAK: 'daily_routine_streak',
        HIGHEST_STREAK: 'daily_routine_highest_streak',
        LAST_STREAK_UPDATE: 'daily_routine_last_streak_update',
        APP_INITIALIZED: 'daily_routine_app_initialized'
    };

    static isStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('Local storage not available:', e);
            return false;
        }
    }

    // Check if app has been initialized before
    static isAppInitialized() {
        try {
            const initialized = localStorage.getItem(this.STORAGE_KEYS.APP_INITIALIZED);
            return initialized === 'true';
        } catch (error) {
            console.error('Error checking app initialization:', error);
            return false;
        }
    }

    // Mark app as initialized
    static markAppInitialized() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.APP_INITIALIZED, 'true');
            return true;
        } catch (error) {
            console.error('Error marking app as initialized:', error);
            return false;
        }
    }

    static saveTasks(tasks) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            return false;
        }
    }

    static loadTasks() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.TASKS);
            if (data) {
                const tasks = JSON.parse(data);
                return Array.isArray(tasks) ? tasks : [];
            }
            return []; // Return empty array instead of null
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    static saveRecords(records) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.RECORDS, JSON.stringify(records));
            return true;
        } catch (error) {
            console.error('Error saving records:', error);
            return false;
        }
    }

    static loadRecords() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.RECORDS);
            if (data) {
                const records = JSON.parse(data);
                return records && typeof records === 'object' ? records : {};
            }
            return {};
        } catch (error) {
            console.error('Error loading records:', error);
            return {};
        }
    }

    static saveGoals(goals) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.GOALS, JSON.stringify(goals));
            return true;
        } catch (error) {
            console.error('Error saving goals:', error);
            return false;
        }
    }

    static loadGoals() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.GOALS);
            if (data) {
                const goals = JSON.parse(data);
                return Array.isArray(goals) ? goals : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading goals:', error);
            return [];
        }
    }

    static saveStreak(streak) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.STREAK, JSON.stringify(streak));
            return true;
        } catch (error) {
            console.error('Error saving streak:', error);
            return false;
        }
    }

    static loadStreak() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.STREAK);
            if (data) {
                return JSON.parse(data);
            }
            return 0;
        } catch (error) {
            console.error('Error loading streak:', error);
            return 0;
        }
    }

    static saveHighestStreak(streak) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.HIGHEST_STREAK, JSON.stringify(streak));
            return true;
        } catch (error) {
            console.error('Error saving highest streak:', error);
            return false;
        }
    }

    static loadHighestStreak() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.HIGHEST_STREAK);
            if (data) {
                return JSON.parse(data);
            }
            return 0;
        } catch (error) {
            console.error('Error loading highest streak:', error);
            return 0;
        }
    }

    static saveLastStreakUpdate(date) {
        try {
            this.markAppInitialized();
            localStorage.setItem(this.STORAGE_KEYS.LAST_STREAK_UPDATE, date);
            return true;
        } catch (error) {
            console.error('Error saving last streak update:', error);
            return false;
        }
    }

    static loadLastStreakUpdate() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.LAST_STREAK_UPDATE);
        } catch (error) {
            console.error('Error loading last streak update:', error);
            return null;
        }
    }

    // Clear all data permanently
    static clearAllData() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            localStorage.removeItem('lastAutoMarkDate');
            console.log('🗑️ All data cleared from storage');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Reset app to initial state
    static resetApp() {
        try {
            this.clearAllData();
            console.log('🔄 App reset to initial state');
            return true;
        } catch (error) {
            console.error('Error resetting app:', error);
            return false;
        }
    }

    // Method to export all data
    static exportAllData() {
        try {
            const data = {};
            Object.entries(this.STORAGE_KEYS).forEach(([key, storageKey]) => {
                if (storageKey !== this.STORAGE_KEYS.APP_INITIALIZED) {
                    const item = localStorage.getItem(storageKey);
                    if (item) {
                        try {
                            data[key.toLowerCase()] = JSON.parse(item);
                        } catch (e) {
                            data[key.toLowerCase()] = item;
                        }
                    }
                }
            });
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    // Method to import data
    static importAllData(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                const storageKey = this.STORAGE_KEYS[key.toUpperCase()];
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(value));
                }
            });
            this.markAppInitialized();
            console.log('✅ Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}