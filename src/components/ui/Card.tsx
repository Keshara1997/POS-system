import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    glass?: boolean;
    onClick?: () => void;
}

export function Card({ children, className = '', hover = false, glass = false, onClick }: CardProps) {
    const baseClasses = glass ? 'card-glass' : 'card';
    const hoverClasses = hover ? 'card-hover' : '';

    const Component = onClick ? motion.div : motion.div;

    return (
        <Component
            className={`${baseClasses} ${hoverClasses} ${className}`}
            onClick={onClick}
            whileHover={hover ? { y: -2 } : {}}
            transition={{ duration: 0.2 }}
            layout
        >
            {children}
        </Component>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    variant = 'primary',
    trend,
    className = ''
}: StatCardProps) {
    const variantClasses = {
        primary: 'stat-card',
        success: 'stat-card-success',
        warning: 'stat-card-warning',
        danger: 'stat-card-danger'
    };

    return (
        <motion.div
            className={`${variantClasses[variant]} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">{title}</h3>
                    {icon && <div className="opacity-80">{icon}</div>}
                </div>

                <div className="text-2xl font-bold mb-1">{value}</div>

                {subtitle && (
                    <p className="text-sm opacity-80">{subtitle}</p>
                )}

                {trend && (
                    <div className="flex items-center mt-2 text-sm">
                        <span className={`font-medium ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                        <span className="ml-1 opacity-80">vs last period</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

