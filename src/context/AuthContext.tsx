/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types/ticket';
import { gsheet } from '../lib/gsheet';

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
            // Path: src/context/AuthContext.tsx
            // Direct query to User_Master for authentication
            const query = 'SELECT * FROM User_Master WHERE User_Code = @userCode';
            const result = await gsheet.query(query, { userCode });

            if (result.recordset && result.recordset.length > 0) {
                const dbUser = result.recordset[0];

                // For direct-sheet version, we do a basic password check.
                const userPassword = dbUser.Password || dbUser.Password_Hash;
                if (String(userPassword) === password) {
                    const userData: User = {
                        id: dbUser.User_ID,
                        name: dbUser.Full_Name,
                        role: dbUser.Role || 'User',
                        avatar: `https://ui-avatars.com/api/?name=${dbUser.Full_Name}&background=random`
                    };

                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('token', 'direct_access_mode');
                } else {
                    throw new Error('Invalid password');
                }
            } else {
                throw new Error('User not found');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
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
