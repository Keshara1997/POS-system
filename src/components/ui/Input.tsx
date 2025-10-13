import { motion } from 'framer-motion';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helper?: string;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helper,
    icon,
    iconPosition = 'left',
    size = 'md',
    variant = 'default',
    className = '',
    ...props
}, ref) => {
    const sizeClasses = {
        sm: 'input-sm',
        md: '',
        lg: 'text-lg py-4'
    };

    const variantClasses = {
        default: 'input',
        filled: 'input bg-secondary-100 dark:bg-secondary-700'
    };

    return (
        <motion.div
            className={`space-y-2 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {label && (
                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
                        {icon}
                    </div>
                )}

                <motion.input
                    ref={ref}
                    className={`${variantClasses[variant]} ${sizeClasses[size]} ${icon && iconPosition === 'left' ? 'pl-10' : ''
                        } ${icon && iconPosition === 'right' ? 'pr-10' : ''
                        } ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
                        }`}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
                        {icon}
                    </div>
                )}
            </div>

            {error && (
                <motion.p
                    className="text-sm text-danger-600 dark:text-danger-400"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {error}
                </motion.p>
            )}

            {helper && !error && (
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {helper}
                </p>
            )}
        </motion.div>
    );
});

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helper?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label,
    error,
    helper,
    size = 'md',
    className = '',
    ...props
}, ref) => {
    const sizeClasses = {
        sm: 'input-sm',
        md: '',
        lg: 'text-lg py-4'
    };

    return (
        <motion.div
            className={`space-y-2 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {label && (
                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                    {label}
                </label>
            )}

            <motion.textarea
                ref={ref}
                className={`textarea ${sizeClasses[size]} ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
                    }`}
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                {...props}
            />

            {error && (
                <motion.p
                    className="text-sm text-danger-600 dark:text-danger-400"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {error}
                </motion.p>
            )}

            {helper && !error && (
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {helper}
                </p>
            )}
        </motion.div>
    );
});

Textarea.displayName = 'Textarea';

