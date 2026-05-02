import os
content = """import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, User } from 'firebase/auth';

export const usePrototypeViewModel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const generateCard = async (data: any) => {
    if (!user) { setError('Please login'); return; }
    setIsGenerating(true);
    try {
      const token = await user.getIdToken();
      let imageKey = data.imageKey;
      if (data.imageFile) {
        const res = await fetch('https://api.syncheartist.com/api/upload', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token },
          body: data.imageFile
        });
        imageKey = (await res.json()).key;
      }
      const res = await fetch('https://api.syncheartist.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...data, imageKey, userId: user.uid })
      });
      setShareLink((await res.json()).shareLink);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    user, isLoggedIn: !!user, isGenerating, shareLink, error,
    login, logout, generateCard, setShareLink,
    isMenuOpen: false, setIsMenuOpen: (v: any) => {},
    activePage: 'home', setActivePage: (v: any) => {},
    language: 'zh', setLanguage: (v: any) => {},
    credits: 0, translations: {}
  };
};
"""
with open('src/viewmodels/usePrototypeViewModel.ts', 'w') as f:
    f.write(content)
