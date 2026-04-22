"use client";

import './globals.css';
import { FESTIVAL_OPTIONS } from '../constants/generationOptions';
import type { PageKey } from '../models/types';
import { usePrototypeViewModel } from '../viewmodels/usePrototypeViewModel';
import { locales } from '../constants/locales';

export default function Home() {
  const vm = usePrototypeViewModel();
  const t = locales[vm.language];

  function renderHome() {
    return (
      <section className="panel heroPanel">
        <div className="heroGallery">
          <div className="iconStack">
            <div className="webIcon pic1">
              <div className="mockHeader"><span/><span/><span/></div>
              <div className="mockBody"><div className="mockImg">✨</div><div className="mockText"/></div>
            </div>
            <div className="webIcon pic2">
              <div className="mockHeader"><span/><span/><span/></div>
              <div className="mockBody"><div className="mockImg">💖</div><div className="mockText"/></div>
            </div>
            <div className="webIcon pic3">
              <div className="mockHeader"><span/><span/><span/></div>
              <div className="mockBody"><div className="mockImg">🎉</div><div className="mockText"/></div>
            </div>
          </div>
        </div>
        <h1>{t.heroTitle}</h1>
        <p className="lead">{t.heroSubtitle}</p>
        <div className="ctaRow center">
          <button className="large" onClick={() => vm.setActivePage('create')}>
            {t.btnStart}
          </button>
        </div>
      </section>
    );
  }

  function renderAuth() {
    return (
      <section className="panel center">
        <h2>{t.authTitle}</h2>
        <p className="lead">{t.authSubtitle}</p>
        <div className="socialAuth">
          <button type="button" className="socialBtn" onClick={vm.handleGoogleLogin}>
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t.authBtnGoogle}
          </button>
        </div>
      </section>
    );
  }

  function renderDashboard() {
    if (!vm.isLoggedIn) {
      return (
        <section className="panel center">
          <h2>{t.dashTitle}</h2>
          <p className="lead">{t.dashNotLoggedIn}</p>
          <button className="large" onClick={() => vm.setActivePage('auth')}>
            {t.dashBtnLogin}
          </button>
        </section>
      );
    }

    return (
      <section className="panel">
        <h2>{t.dashTitle}</h2>
        <div className="stats">
          <article className="card stat">
            <small>{t.dashCredits}</small>
            <strong>{vm.credits}</strong>
          </article>
          <article className="card stat">
            <small>{t.dashHistory}</small>
            <strong>{vm.history.length}</strong>
          </article>
        </div>
        <div className="ctaRow center">
          <button className="large" onClick={() => vm.setActivePage('create')}>
            {t.btnStart}
          </button>
          <button className="ghost large" onClick={() => vm.setActivePage('credits')}>
            {t.dashBtnBuy}
          </button>
        </div>
        <div className="ctaRow center" style={{ marginTop: '16px' }}>
          <button className="ghost small" onClick={vm.handleLogout}>
            {t.authLogout}
          </button>
        </div>
      </section>
    );
  }

  function renderCreate() {
    return (
      <section className="panel">
        <h2>{t.createTitle}</h2>
        <form className="formCard long" onSubmit={vm.handleCreateSubmit}>
          <fieldset>
            <legend>{t.createPhoto}</legend>
            <label className="uploadArea">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hiddenFileInput"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  vm.setImageFileName(file?.name ?? t.createPhotoUnselected);
                  vm.setImageFile(file || null);
                }}
              />
              <div className="uploadContent">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>{vm.imageFileName === '未選擇檔案' || vm.imageFileName === 'Not selected' || vm.imageFileName === '未選擇' ? t.uploadBtnText : vm.imageFileName}</span>
              </div>
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.createFestival}</legend>
            <div className="chipGroup">
              {FESTIVAL_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={vm.festival === item ? 'chip active' : 'chip'}
                  onClick={() => vm.handleFestivalChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {vm.festival === '其他' && (
              <input
                value={vm.festivalCustom}
                onChange={(event) => vm.setFestivalCustom(event.target.value)}
                placeholder={t.createCustomFestival}
              />
            )}
          </fieldset>

          <fieldset>
            <legend>{t.createStyle}</legend>
            <div className="switchRow">
              <button
                type="button"
                className={vm.styleCategory === 'character_transform' ? 'chip active' : 'chip'}
                onClick={() => vm.handleStyleCategoryChange('character_transform')}
              >
                {t.createStyleChar}
              </button>
              <button
                type="button"
                className={vm.styleCategory === 'art_illustration' ? 'chip active' : 'chip'}
                onClick={() => vm.handleStyleCategoryChange('art_illustration')}
              >
                {t.createStyleArt}
              </button>
            </div>
            <select
              value={vm.styleName}
              onChange={(event) => vm.setStyleName(event.target.value)}
            >
              {vm.styleOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </fieldset>

          <fieldset>
            <legend>{t.createDecorations}</legend>
            <div className="chipGroup">
              {vm.suggestedDecorations.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={vm.decorations.includes(item) ? 'chip active' : 'chip'}
                  onClick={() => vm.toggleDecoration(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.createBlessing}</legend>
            <textarea
              value={vm.blessing}
              onChange={(event) => vm.setBlessing(event.target.value)}
              rows={3}
              placeholder={t.createBlessingPlaceholder}
            />
          </fieldset>

          <fieldset>
            <legend>{t.createNote}</legend>
            <textarea
              value={vm.extraNote}
              onChange={(event) => vm.setExtraNote(event.target.value)}
              rows={2}
              placeholder={t.createNotePlaceholder}
            />
          </fieldset>

          <section className="stickySummary">
            <div className="costRow">
              <span>{t.createCostReq} <strong>{vm.estimatedCost}</strong> {t.createCostPts}</span>
              <small>{t.createCostRem} {vm.credits} {t.createCostPts}</small>
            </div>
            <button type="submit" className="large" disabled={vm.isGenerating}>
              {vm.isGenerating ? t.createBtnGenLoading : t.createBtnGen}
            </button>
          </section>
        </form>
      </section>
    );
  }

  function renderCredits() {
    return (
      <section className="panel">
        <h2>{t.creditsTitle}</h2>
        <div className="grid two">
          <article className="card center">
            <h3>150 {t.createCostPts}</h3>
            <p>HK$ 28</p>
            <button onClick={() => vm.handlePurchase(150, 28)}>{t.creditsBuy}</button>
          </article>
          <article className="card center">
            <h3>600 {t.createCostPts}</h3>
            <p>HK$ 98</p>
            <button onClick={() => vm.handlePurchase(600, 98)}>{t.creditsBuy}</button>
          </article>
        </div>
      </section>
    );
  }

  function renderHistory() {
    return (
      <section className="panel">
        <h2>{t.histTitle}</h2>
        {vm.history.length === 0 ? (
          <p className="lead">{t.histEmpty}</p>
        ) : (
          <div className="historyList">
            {vm.history.map((item) => (
              <article key={item.id} className="card historyItem">
                <p><strong>{item.festival}</strong> - {item.styleName}</p>
                <small>{item.createdAt}</small>
                <a href={item.shareLink}>{t.histLink}</a>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderPaymentSuccess() {
    return (
      <section className="panel center">
        <h2>{t.payTitle}</h2>
        <p className="lead">{t.payDesc}</p>
        <button className="large" onClick={() => vm.setActivePage('dashboard')}>
          {t.payBtnBack}
        </button>
      </section>
    );
  }

  function renderActivePage() {
    switch (vm.activePage) {
      case 'home':
        return renderHome();
      case 'auth':
        return renderAuth();
      case 'dashboard':
        return renderDashboard();
      case 'create':
        return renderCreate();
      case 'credits':
        return renderCredits();
      case 'history':
        return renderHistory();
      case 'payment-success':
        return renderPaymentSuccess();
      default:
        return renderHome();
    }
  }

  return (
    <div className="appRoot">
      <header className="topBar">
        <div className="navLeft">
          <button className="menuBtn" onClick={() => vm.setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <p className="brand">SyncHeartist</p>
        </div>
        <div className="navRight">
          {vm.isLoggedIn && (
            <div className="creditBadge">{vm.credits} {t.createCostPts}</div>
          )}
        </div>
      </header>

      {vm.isMenuOpen && (
        <div className="menuOverlay" onClick={() => vm.setIsMenuOpen(false)}>
          <nav className="sideMenu" onClick={(e) => e.stopPropagation()}>
            <div className="menuHeader">
              <p className="brand">SyncHeartist</p>
              <button className="closeBtn" onClick={() => vm.setIsMenuOpen(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="menuLinks">
              {[
                ['home', t.navHome],
                ['create', t.navCreate],
                ['dashboard', t.navDash],
                ['history', t.navHist],
                ['credits', t.navCred],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={vm.activePage === key ? 'active' : ''}
                  onClick={() => {
                    vm.setActivePage(key as PageKey);
                    vm.setIsMenuOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="languageToggle">
              <p className="langLabel">{t.langTitle}</p>
              <div className="langRow">
                <button 
                  className={vm.language === 'zh' ? 'active' : ''} 
                  onClick={() => vm.setLanguage('zh')}
                >
                  繁體中文
                </button>
                <button 
                  className={vm.language === 'en' ? 'active' : ''} 
                  onClick={() => vm.setLanguage('en')}
                >
                  English
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      <main>{renderActivePage()}</main>
    </div>
  );
}
