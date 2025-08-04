import { useEffect, useState } from 'react';

import type { User } from '../types/user';

async function getUser(): Promise<User> {
  const res = await fetch(`http://${import.meta.env.VITE_BACKEND_URL}/api/user/assign`);
  if (!res.ok) throw new Error('Failed to assign user');
  return res.json();
}

export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('chat-user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return;
    }

    getUser()
      .then((userData) => {
        localStorage.setItem('chat-user', JSON.stringify(userData));
        setUser(userData);
      })
      .catch(console.error);
  }, []);

  return user;
}
