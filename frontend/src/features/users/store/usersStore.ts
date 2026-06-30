import { create } from 'zustand';
import type { UserPublic } from '@webchat/shared';

interface UsersState {
  users: UserPublic[];
  setUsers: (users: UserPublic[]) => void;
  addUser: (user: UserPublic) => void;
  removeUser: (userId: string) => void;
  updateUser: (user: UserPublic) => void;
  clear: () => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
  addUser: (user) =>
    set((state) => {
      if (state.users.some((u) => u.userId === user.userId)) return state;
      return { users: [...state.users, user] };
    }),
  removeUser: (userId) =>
    set((state) => ({ users: state.users.filter((u) => u.userId !== userId) })),
  updateUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u.userId === user.userId ? user : u)),
    })),
  clear: () => set({ users: [] }),
}));
