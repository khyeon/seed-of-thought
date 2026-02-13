import { create } from 'zustand';

interface UserState {
    userId: string | null;
    userName: string | null;
    username: string | null;
    role: 'CHILD' | 'PARENT' | null;
    familyId: string | null;
    isLoggedIn: boolean;
    setUser: (user: { id: string; name: string; username: string; role: string; familyId: string }) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    userId: null,
    userName: null,
    username: null,
    role: null,
    familyId: null,
    isLoggedIn: false,
    setUser: (user) => set({
        userId: user.id,
        userName: user.name,
        username: user.username,
        role: user.role as any,
        familyId: user.familyId,
        isLoggedIn: true,
    }),
    clearUser: () => set({
        userId: null,
        userName: null,
        username: null,
        role: null,
        familyId: null,
        isLoggedIn: false,
    }),
}));
