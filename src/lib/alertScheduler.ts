import { useEffect, useRef } from 'react';
import { alertService } from '../lib/alertService';

// Alert Scheduler Hook
export function useAlertScheduler(intervalMinutes: number = 60) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Start the scheduler
        const startScheduler = () => {
            // Clear any existing interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Run initial check
            runAlertCheck();

            // Set up recurring check
            intervalRef.current = setInterval(() => {
                runAlertCheck();
            }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
        };

        const runAlertCheck = async () => {
            try {
                console.log('Running scheduled alert check...');
                const results = await alertService.runAlertCheck();

                if (results.length > 0) {
                    const successfulAlerts = results.filter(r => r.shouldSend).length;
                    console.log(`Alert check completed: ${successfulAlerts}/${results.length} alerts sent`);
                }
            } catch (error) {
                console.error('Error in scheduled alert check:', error);
            }
        };

        startScheduler();

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [intervalMinutes]);

    return {
        runManualCheck: async () => {
            try {
                const results = await alertService.runAlertCheck();
                return results;
            } catch (error) {
                console.error('Error in manual alert check:', error);
                throw error;
            }
        }
    };
}

// Alert Status Indicator Component
export function AlertStatusIndicator() {
    const { runManualCheck } = useAlertScheduler();

    const handleManualCheck = async () => {
        try {
            const results = await runManualCheck();
            const successfulAlerts = results.filter(r => r.shouldSend).length;

            if (successfulAlerts > 0) {
                console.log(`Manual alert check: ${successfulAlerts} alerts sent`);
            } else {
                console.log('Manual alert check: No alerts needed');
            }
        } catch (error) {
            console.error('Manual alert check failed:', error);
        }
    };

    return (
        <div className= "flex items-center space-x-2" >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title = "Alert system active" />
            <button
        onClick={ handleManualCheck }
    className = "text-xs text-gray-600 hover:text-gray-900 transition-colors"
    title = "Run manual alert check"
        >
        Check Alerts
            </button>
            </div>
  );
}
