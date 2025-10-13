import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    theme: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
        if (savedTheme) {
            setThemeState(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(systemTheme);
            root.classList.toggle('dark', systemTheme);
        } else {
            const shouldBeDark = theme === 'dark';
            setIsDark(shouldBeDark);
            root.classList.toggle('dark', shouldBeDark);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

