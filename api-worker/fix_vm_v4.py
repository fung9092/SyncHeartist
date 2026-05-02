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
    if (!user) { setError('Please login first'); return; }
    setIsGenerating(true);
    setError(null);
    setShareLink(null);
    
    try {
      const token = await user.getIdToken();
      let imageKey = data.imageKey;
      
      if (data.imageFile) {
        const uploadRes = await fetch('https://syncheartist-api.hung145910.workers.dev/api/upload', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token },
          body: data.imageFile
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        imageKey = (await uploadRes.json()).key;
      }
      
      const res = await fetch('https://syncheartist-api.hung145910.workers.dev/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...data, imageKey, userId: user.uid })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Generation failed');
      
      setShareLink(result.shareLink);
    } catch (err: any) {
      console.error('Generation error:', err);
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
