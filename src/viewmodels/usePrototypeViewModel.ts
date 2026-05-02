import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, User } from 'firebase/auth';
import type { PageKey, HistoryItem, StyleCategory } from '../models/types';

export const usePrototypeViewModel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDraftPopupOpen, setIsDraftPopupOpen] = useState(false);
  
  // Data States
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedShareLink, setGeneratedShareLink] = useState<string>('');
  
  // Form States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [festival, setFestival] = useState('生日');
  const [festivalCustom, setFestivalCustom] = useState('');
  const [styleCategory, setStyleCategory] = useState<StyleCategory>('art_illustration');
  const [styleName, setStyleName] = useState('現代極簡');
  const [decorations, setDecorations] = useState<string[]>([]);
  const [blessing, setBlessing] = useState('');
  const [extraNote, setExtraNote] = useState('');
  
  const styleOptionsChar = ['超級英雄變身', '王子公主禮服', '日系動漫風格', '3D動畫角色'];
  const styleOptionsArt = ['現代極簡', '浪漫唯美', '復古懷舊', '手繪插畫', '賽博龐克'];
  const suggestedDecorations = ['愛心', '星星', '煙花', '氣球', '花朵', '彩帶'];

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchUserData(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`https://api.syncheartist.com/api/user/${uid}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits || 0);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setActivePage('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActivePage('home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setActivePage('auth'); return; }
    setIsGenerating(true);
    try {
      const token = await user.getIdToken();
      let imageKey = '';
      
      if (imageFile) {
        const uploadRes = await fetch('https://api.syncheartist.com/api/upload', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token },
          body: imageFile
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageKey = uploadData.key;
        }
      }

      const res = await fetch('https://api.syncheartist.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          prompt: blessing,
          festival: festival === '其他' ? festivalCustom : festival,
          style: styleName,
          category: styleCategory,
          decorations,
          extraNote,
          imageKey,
          userId: user.uid
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedShareLink(data.shareLink);
        setIsPopupOpen(true);
        fetchUserData(user.uid);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchase = async (credits: number, amount: number) => {
    // Stripe integration logic would go here
    alert(`Redirecting to Stripe for ${credits} credits...`);
  };

  return {
    user, isLoggedIn: !!user, isGenerating, error,
    activePage, setActivePage,
    isMenuOpen, setIsMenuOpen,
    language, setLanguage,
    isPopupOpen, setIsPopupOpen,
    isDraftPopupOpen, setIsDraftPopupOpen,
    credits, history, generatedShareLink,
    imageFile, setImageFile, imageFileName, setImageFileName,
    festival, setFestival, festivalCustom, setFestivalCustom,
    styleCategory, setStyleCategory, styleName, setStyleName,
    decorations, setDecorations, blessing, setBlessing,
    extraNote, setExtraNote,
    styleOptionsChar, styleOptionsArt, suggestedDecorations,
    handleGoogleLogin, handleLogout, handleCreateSubmit, handlePurchase,
    // Add missing handlers used in page.tsx
    handleFestivalChange: (val: string) => setFestival(val),
    handleStyleCategoryChange: (cat: StyleCategory, name: string) => {
      setStyleCategory(cat);
      setStyleName(name);
    },
    toggleDecoration: (item: string) => {
      setDecorations(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    },
    restoreDraft: () => setIsDraftPopupOpen(false),
    discardDraft: () => setIsDraftPopupOpen(false),
  };
};
