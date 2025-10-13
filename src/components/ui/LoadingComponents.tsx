import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            <motion.div
                className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 dark:border-primary-700 dark:border-t-primary-400 rounded-full`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
            {text && (
                <motion.p
                    className={`${textSizeClasses[size]} text-secondary-600 dark:text-secondary-300 font-medium`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
}

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
}

export function LoadingOverlay({ isVisible, text = 'Loading...' }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="bg-white/90 dark:bg-secondary-800/90 backdrop-blur-md rounded-3xl p-8 shadow-large border border-white/20 dark:border-secondary-700/50"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <LoadingSpinner size="lg" text={text} />
            </motion.div>
        </motion.div>
    );
}

interface SkeletonLoaderProps {
    className?: string;
    lines?: number;
}

export function SkeletonLoader({ className = '', lines = 1 }: SkeletonLoaderProps) {
    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <motion.div
                    key={index}
                    className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded-lg mb-2"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.1
                    }}
                />
            ))}
        </div>
    );
}

