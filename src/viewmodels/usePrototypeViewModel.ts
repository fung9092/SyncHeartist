import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, User } from 'firebase/auth';

export type PageKey = 'home' | 'create' | 'history' | 'credits' | 'login' | 'payment-success';

export interface HistoryItem {
  id: string;
  festivalKey: string;
  styleKey: string;
  shareLink: string;
  createdAt: number;
  cardLabel?: string;
  colorMeta?: string;
  blessingText?: string;
}

// Client-side image compression to reduce upload size
async function compressImage(file: File, maxSizeMB: number = 10, maxDimension: number = 2048): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeMB * 1024 * 1024 && !file.type.includes('heic') && !file.type.includes('heif')) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export const usePrototypeViewModel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locale, setLocale] = useState('zh');

  // Data States
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedShareLink, setGeneratedShareLink] = useState<string>('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Welcome popup state
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Confirmation popup state
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Edit card states
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [editPreviewLink, setEditPreviewLink] = useState('');
  const [editOriginalLink, setEditOriginalLink] = useState('');

  // Form States
  const [imageFile, setImageFileState] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const setImageFile = (file: File | null) => {
    setImageFileState(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl('');
    }
  };
  const removeImage = () => {
    setImageFileState(null);
    setImageFileName('');
    setImagePreviewUrl('');
  };

  const [festival, setFestival] = useState('birthday');
  const [decorations, setDecorations] = useState<string[]>([]);
  const [blessing, setBlessing] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [interactiveEffect, setInteractiveEffect] = useState<string>('none');

  // Color Theme States
  const [colorTheme, setColorTheme] = useState('warm_sunset');
  const [useGradient, setUseGradient] = useState(false);
  const [customColor1, setCustomColor1] = useState('#FF6B9D');
  const [customColor2, setCustomColor2] = useState('#C084FC');
  const [customColor3, setCustomColor3] = useState('#FFFFFF');

  // Escape Button States
  const [escapeQuestion, setEscapeQuestion] = useState('');
  const [escapeAcceptText, setEscapeAcceptText] = useState('');
  const [escapeRejectText, setEscapeRejectText] = useState('');

  // Pop-over States
  const [popOverBtnText, setPopOverBtnText] = useState('');
  const [popOverMessage, setPopOverMessage] = useState('');

  // Card Label State
  const [cardLabel, setCardLabel] = useState('');
  // Recipient Name State
  const [recipientName, setRecipientName] = useState('');
  // Card Language State ('zh' | 'en')
  const [cardLanguage, setCardLanguage] = useState('zh');

  // Reset all form fields to defaults
  const resetForm = () => {
    removeImage();
    setFestival('birthday');
    setDecorations([]);
    setBlessing('');
    setExtraNotes('');
    setInteractiveEffect('none');
    setColorTheme('warm_sunset');
    setUseGradient(false);
    setCustomColor1('#FF6B9D');
    setCustomColor2('#C084FC');
    setCustomColor3('#FFFFFF');
    setEscapeQuestion('');
    setEscapeAcceptText('');
    setEscapeRejectText('');
    setPopOverBtnText('');
    setPopOverMessage('');
    setCardLabel('');
    setRecipientName('');
    setCardLanguage('zh');
  };

  // Dynamic Cost Calculation
  const baseCost = 10;
  const imageCost = imageFile ? 10 : 0;
  const interactiveCost = interactiveEffect !== 'none' ? 5 : 0;
  const estimatedCost = baseCost + imageCost + interactiveCost;

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`https://api.syncheartist.com/api/user/${uid}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits || 0);
        setHistory(data.history || []);
        // Show welcome popup for new users
        if (data.isNewUser) {
          setShowWelcomePopup(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
      if (u) {
        fetchUserData(u.uid);
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
          setActivePage('payment-success');
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => fetchUserData(u.uid), 2000);
          setTimeout(() => fetchUserData(u.uid), 5000);
        }
      }
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  const navigateTo = (page: PageKey) => {
    const publicPages: PageKey[] = ['home', 'login'];
    if (!user && !publicPages.includes(page)) {
      setActivePage('login');
    } else {
      // Reset form when entering the create page
      if (page === 'create') {
        resetForm();
      }
      setActivePage(page);
    }
    setIsMenuOpen(false);
  };

  // Close success popup and navigate to home
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setGeneratedShareLink('');
    setLinkCopied(false);
    navigateTo('home');
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setActivePage('home');
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

  // Step 1: Validate and show confirmation popup
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setActivePage('login'); return; }
    if (!blessing.trim()) {
      setError('請先輸入想說的話。');
      return;
    }
    if (credits < estimatedCost) {
      setError('點數不足，請先前往儲值。');
      return;
    }
    // Show confirmation popup
    setShowConfirmPopup(true);
  };

  // Step 2: Actually submit after confirmation
  const handleConfirmedSubmit = async () => {
    setShowConfirmPopup(false);
    if (!user) { setActivePage('login'); return; }
    setIsGenerating(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      let imageKey = '';
      if (imageFile) {
        setIsUploading(true);
        try {
          const compressed = await compressImage(imageFile);
          const uploadRes = await fetch('https://api.syncheartist.com/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': compressed.type || 'image/jpeg',
            },
            body: compressed
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            imageKey = uploadData.key;
          } else {
            setError('圖片上傳失敗，請檢查格式後重試。');
            setIsGenerating(false);
            setIsUploading(false);
            return;
          }
        } finally {
          setIsUploading(false);
        }
      }

      // Build color theme data for the API
      let colorThemeData: any = { key: colorTheme, useGradient };
      if (colorTheme === 'custom') {
        colorThemeData.colors = [customColor1, customColor2, customColor3];
      }

      // Generate default label if empty
      let finalLabel = cardLabel.trim();
      if (!finalLabel) {
        const defaultBase = locale === 'zh' ? '我的心意卡' : 'My Card';
        const existingDefaults = history.filter(h => {
          const label = h.cardLabel || '';
          return label.startsWith(defaultBase);
        });
        const nextNum = existingDefaults.length + 1;
        finalLabel = `${defaultBase} #${nextNum}`;
      }

      const res = await fetch('https://api.syncheartist.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          prompt: blessing,
          festival,
          decorations,
          extraNote: extraNotes,
          imageKey,
          interactiveEffect: interactiveEffect !== 'none' ? interactiveEffect : undefined,
          colorTheme: colorThemeData,
          escapeQuestion: interactiveEffect === 'escapeBtn' ? escapeQuestion : undefined,
          escapeAcceptText: interactiveEffect === 'escapeBtn' ? escapeAcceptText : undefined,
          escapeRejectText: interactiveEffect === 'escapeBtn' ? escapeRejectText : undefined,
          popOverBtnText: interactiveEffect === 'popOver' ? popOverBtnText : undefined,
          popOverMessage: interactiveEffect === 'popOver' ? popOverMessage : undefined,
          cardLabel: finalLabel,
          recipientName: recipientName.trim() || undefined,
          cardLanguage,
          userId: user.uid
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedShareLink(data.shareLink);
        setCredits(data.remainingCredits);
        setShowSuccessPopup(true);
        setLinkCopied(false);
        setCardLabel('');
        fetchUserData(user.uid);
      } else {
        const errorData = await res.json().catch(() => ({ error: '系統繁忙，請稍後再試' }));
        setError(errorData.error || '生成失敗，請稍後再試');
      }
    } catch (err: any) {
      setError(err.message || '系統繁忙，請稍後再試');
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit card: open edit popup
  const startEditCard = (cardId: string, originalLink: string) => {
    setEditingCardId(cardId);
    setEditOriginalLink(originalLink);
    setEditInstruction('');
    setShowEditPopup(true);
  };

  // Edit card: submit edit request
  const submitEditCard = async () => {
    if (!editingCardId || !editInstruction.trim() || !user) return;
    
    setShowEditPopup(false);
    setIsEditing(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`https://api.syncheartist.com/api/edit/${editingCardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ editInstruction: editInstruction.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setEditPreviewLink(data.previewLink);
        setEditOriginalLink(data.originalLink);
        setShowEditPreview(true);
      } else {
        const errorData = await res.json().catch(() => ({ error: '修改失敗' }));
        setError(errorData.error || '修改失敗，請稍後再試');
      }
    } catch (err: any) {
      setError(err.message || '修改失敗，請稍後再試');
    } finally {
      setIsEditing(false);
    }
  };

  // Edit card: confirm keep new or old
  const confirmEditCard = async (keepNew: boolean) => {
    if (!editingCardId || !user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`https://api.syncheartist.com/api/edit/${editingCardId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ keepNew })
      });

      if (res.ok) {
        // Refresh history to get updated data
        fetchUserData(user.uid);
      } else {
        const errorData = await res.json().catch(() => ({ error: '確認失敗' }));
        setError(errorData.error || '確認失敗');
      }
    } catch (err: any) {
      setError(err.message || '確認失敗');
    } finally {
      setShowEditPreview(false);
      setEditingCardId(null);
      setEditInstruction('');
      setEditPreviewLink('');
      setEditOriginalLink('');
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setShowEditPopup(false);
    setShowEditPreview(false);
    setEditingCardId(null);
    setEditInstruction('');
    setEditPreviewLink('');
    setEditOriginalLink('');
  };

  const handlePurchase = async (credits: number, amountHkd: number) => {
    if (!auth.currentUser) { setActivePage('login'); return; }
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await fetch('https://api.syncheartist.com/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ credits, amountHkd })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedShareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedShareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return {
    user, isLoggedIn: !!user, isReady, isGenerating, isUploading, isEditing, error, setError,
    activePage, navigateTo,
    isMenuOpen, setIsMenuOpen,
    locale, setLocale,
    credits, history, generatedShareLink,
    showSuccessPopup, setShowSuccessPopup, closeSuccessPopup, linkCopied, copyShareLink,
    showWelcomePopup, setShowWelcomePopup,
    showConfirmPopup, setShowConfirmPopup,
    // Edit card
    editingCardId, editInstruction, setEditInstruction,
    showEditPopup, setShowEditPopup,
    showEditPreview, setShowEditPreview,
    editPreviewLink, editOriginalLink,
    startEditCard, submitEditCard, confirmEditCard, cancelEdit,
    // Form
    imageFile, setImageFile, imageFileName, setImageFileName,
    imagePreviewUrl, removeImage,
    festival, setFestival,
    decorations, setDecorations, blessing, setBlessing,
    extraNotes, setExtraNotes,
    interactiveEffect, setInteractiveEffect,
    colorTheme, setColorTheme,
    useGradient, setUseGradient,
    customColor1, setCustomColor1,
    customColor2, setCustomColor2,
    customColor3, setCustomColor3,
    escapeQuestion, setEscapeQuestion,
    escapeAcceptText, setEscapeAcceptText,
    escapeRejectText, setEscapeRejectText,
    popOverBtnText, setPopOverBtnText,
    popOverMessage, setPopOverMessage,
    cardLabel, setCardLabel,
    recipientName, setRecipientName,
    cardLanguage, setCardLanguage,
    estimatedCost,
    handleGoogleLogin, handleLogout,
    handleCreateSubmit: handlePreSubmit,
    handleConfirmedSubmit,
    handlePurchase,
    toggleDecoration: (item: string) => {
      setDecorations(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    },
  };
};
