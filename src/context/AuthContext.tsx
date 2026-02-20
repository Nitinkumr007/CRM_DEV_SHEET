/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types/ticket';

interface AuthContextType {
    user: User | null;
    login: (userCode: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Lazy initialization for state to avoid useEffect warning and improve performance
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (error) {
                console.error("Failed to parse user session", error);
                localStorage.removeItem('user');
            }
        }
        return null;
    });

    const login = async (userCode: string, password: string) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userCode, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            const { user, token } = data;

            // Add token to user object or store separately if needed
            // For now, storing user in state and local storage as before
            const userWithToken = { ...user, token };

            setUser(userWithToken);
            localStorage.setItem('user', JSON.stringify(userWithToken));
            localStorage.setItem('token', token); // Store token separately for API calls
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        // Call Logout API to record logout time
        if (user && user.id) {
            fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            }).catch(err => console.error('Logout API Error:', err));
        }

        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
