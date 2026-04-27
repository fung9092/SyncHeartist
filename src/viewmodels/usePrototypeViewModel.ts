import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  ART_STYLES,
  CHARACTER_STYLES,
  DECORATION_BY_FESTIVAL,
} from '../constants/generationOptions'
import type { HistoryItem, PageKey, StyleCategory } from '../models/types'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'

export function usePrototypeViewModel() {
  const [activePage, setActivePageRaw] = useState<PageKey>('home')
  const [credits, setCredits] = useState(20)
  const [festival, setFestival] = useState('生日')
  const [festivalCustom, setFestivalCustom] = useState('')
  const [styleCategory, setStyleCategory] =
    useState<StyleCategory>('character_transform')
  const [styleName, setStyleName] = useState(CHARACTER_STYLES[0])
  const [decorations, setDecorations] = useState<string[]>(['生日蛋糕'])
  const [blessing, setBlessing] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [imageFileName, setImageFileName] = useState('未選擇檔案')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [generatedShareLink, setGeneratedShareLink] = useState('')
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isDraftPopupOpen, setIsDraftPopupOpen] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<any>(null)
  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const styleOptions =
    styleCategory === 'character_transform' ? CHARACTER_STYLES : ART_STYLES
  const suggestedDecorations =
    DECORATION_BY_FESTIVAL[festival === '其他' ? '其他' : festival] ?? []

  const estimatedCost = useMemo(() => {
    let cost = 10
    cost += decorations.length
    if (extraNote.trim()) cost += 2
    return cost
  }, [decorations.length, extraNote])

  const selectedFestivalLabel =
    festival === '其他' && festivalCustom.trim()
      ? `其他：${festivalCustom.trim()}`
      : festival

  const generatedPrompt = useMemo(() => {
    const stylePrefix =
      styleCategory === 'character_transform'
        ? 'Keep the face identical. '
        : ''
    const parts = [
      `${stylePrefix}風格：${styleName}`,
      `節日/時刻：${selectedFestivalLabel}`,
      decorations.length > 0 ? `裝飾：${decorations.join('、')}` : '',
      blessing.trim() ? `祝福語：${blessing.trim()}` : '',
      extraNote.trim() ? `額外說明：${extraNote.trim()}` : '',
      '整體方向：溫暖、節日感、個人化。',
    ].filter(Boolean)
    return parts.join('\n')
  }, [
    blessing,
    decorations,
    extraNote,
    selectedFestivalLabel,
    styleCategory,
    styleName,
  ])

  // Handle URL params for Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment_success') === 'true') {
        setActivePageRaw('payment-success');
      }
    }
  }, []);

  // Session Timeout (30 mins of inactivity)
  useEffect(() => {
    if (!isLoggedIn) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000;
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        window.alert(language === 'zh' ? '您已閒置超過30分鐘，為保障安全已自動登出。' : 'You have been automatically logged out due to 30 minutes of inactivity.');
      }, SESSION_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isLoggedIn, language]);

  // Save Draft logic
  useEffect(() => {
    if (activePage === 'create' && !isDraftPopupOpen && !isGenerating) {
      const draft = {
        festival,
        festivalCustom,
        styleCategory,
        styleName,
        decorations,
        blessing,
        extraNote,
      };
      localStorage.setItem('syncheartist_draft', JSON.stringify(draft));
    }
  }, [activePage, festival, festivalCustom, styleCategory, styleName, decorations, blessing, extraNote, isDraftPopupOpen, isGenerating]);

  function setActivePage(page: PageKey) {
    if (page !== 'home' && !isLoggedIn) {
      setActivePageRaw('auth');
    } else {
      if (page === 'create' && activePage !== 'create') {
        const savedDraft = localStorage.getItem('syncheartist_draft');
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed && (parsed.blessing || parsed.festivalCustom || parsed.extraNote || (parsed.decorations && parsed.decorations.length > 0))) {
              setPendingDraft(parsed);
              setIsDraftPopupOpen(true);
            }
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
      }
      setActivePageRaw(page);
    }
  }

  function restoreDraft() {
    if (pendingDraft) {
      if (pendingDraft.festival) setFestival(pendingDraft.festival);
      if (pendingDraft.festivalCustom) setFestivalCustom(pendingDraft.festivalCustom);
      if (pendingDraft.styleCategory) setStyleCategory(pendingDraft.styleCategory);
      if (pendingDraft.styleName) setStyleName(pendingDraft.styleName);
      if (pendingDraft.decorations) setDecorations(pendingDraft.decorations);
      if (pendingDraft.blessing) setBlessing(pendingDraft.blessing);
      if (pendingDraft.extraNote) setExtraNote(pendingDraft.extraNote);
    }
    setIsDraftPopupOpen(false);
    setPendingDraft(null);
  }

  function discardDraft() {
    localStorage.removeItem('syncheartist_draft');
    setFestival('生日');
    setFestivalCustom('');
    setStyleCategory('character_transform');
    setStyleName(CHARACTER_STYLES[0]);
    setDecorations(['生日蛋糕']);
    setBlessing('');
    setExtraNote('');
    setIsDraftPopupOpen(false);
    setPendingDraft(null);
  }

  function handleFestivalChange(value: string) {
    setFestival(value)
    const nextDecorations = DECORATION_BY_FESTIVAL[value] ?? []
    setDecorations(nextDecorations.slice(0, 2))
  }

  function handleStyleCategoryChange(nextCategory: StyleCategory, defaultStyle?: string) {
    setStyleCategory(nextCategory)
    setStyleName(
      defaultStyle || (nextCategory === 'character_transform' ? CHARACTER_STYLES[0] : ART_STYLES[0])
    )
  }

  function toggleDecoration(item: string) {
    setDecorations((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    )
  }

  function handleGoogleLogin() {
    signInWithPopup(auth, googleProvider)
      .then(() => {
        setIsLoggedIn(true);
        setActivePageRaw('create');
      })
      .catch((error) => {
        console.error("Google login error:", error);
        window.alert((language === 'zh' ? '登入失敗：' : 'Login failed: ') + error.message);
      });
  }

  function handleLogout() {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setActivePageRaw('home');
    });
  }

  async function handlePurchase(creditsToAdd: number, amountHkd: number) {
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountHkd, credits: creditsToAdd }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        alert(language === 'zh' ? '建立結帳失敗' : 'Failed to create checkout');
      }
    } catch (e) {
      console.error(e);
      alert(language === 'zh' ? '發生錯誤' : 'Error occurred');
    }
  }

  async function handleCreateSubmit(event: FormEvent) {
    event.preventDefault()
    if (credits < estimatedCost) {
      window.alert(language === 'zh' ? '點數不足，請先購買點數。' : 'Not enough credits. Please buy credits.')
      setActivePage('credits')
      return
    }
    if (!blessing.trim()) {
      window.alert(language === 'zh' ? '請先輸入祝福語。' : 'Please enter a message.')
      return
    }

    setIsGenerating(true)

    let imageBase64 = '';
    if (imageFile) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatedPrompt, cost: estimatedCost, imageBase64 })
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      const now = new Date()
      const item: HistoryItem = {
        id: `${now.getTime()}`,
        createdAt: now.toLocaleString(language === 'zh' ? 'zh-HK' : 'en-US'),
        festival: selectedFestivalLabel,
        styleName,
        creditsUsed: estimatedCost,
        status: 'succeeded',
        shareLink: data.shareLink,
      }
      setHistory((prev) => [item, ...prev])
      setCredits((prev) => prev - estimatedCost)
      setGeneratedShareLink(data.shareLink)
      localStorage.removeItem('syncheartist_draft');
      setIsPopupOpen(true)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      alert((language === 'zh' ? '生成失敗：' : 'Generation failed: ') + errMsg);
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    activePage,
    setActivePage,
    credits,
    setCredits,
    isLoggedIn,
    setIsLoggedIn,
    festival,
    setFestival,
    festivalCustom,
    setFestivalCustom,
    styleCategory,
    styleName,
    setStyleName,
    decorations,
    blessing,
    setBlessing,
    extraNote,
    setExtraNote,
    imageFileName,
    setImageFileName,
    imageFile,
    setImageFile,
    isGenerating,
    history,
    generatedShareLink,
    setGeneratedShareLink,
    isPopupOpen,
    setIsPopupOpen,
    isDraftPopupOpen,
    setIsDraftPopupOpen,
    restoreDraft,
    discardDraft,
    isMenuOpen,
    setIsMenuOpen,
    language,
    setLanguage,
    styleOptionsChar: CHARACTER_STYLES,
    styleOptionsArt: ART_STYLES,
    suggestedDecorations,
    estimatedCost,
    generatedPrompt,
    handleFestivalChange,
    handleStyleCategoryChange,
    toggleDecoration,
    handleGoogleLogin,
    handleLogout,
    handlePurchase,
    handleCreateSubmit,
  }
}
