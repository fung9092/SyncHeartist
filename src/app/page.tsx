"use client";
import React from "react";
import { usePrototypeViewModel } from "../viewmodels/usePrototypeViewModel";
import { locales as LOCALES } from "../constants/locales";
import {
  FESTIVAL_OPTIONS,
  DECORATION_BY_FESTIVAL,
  COLOR_THEMES,
} from "../constants/generationOptions";

export default function Page() {
  const vm = usePrototypeViewModel();
  const t = LOCALES[vm.locale as keyof typeof LOCALES];
  const lang = vm.locale as "zh" | "en";

  if (!vm.isReady) return <div className="loading">Loading...</div>;

  // Helper: get festival display name
  const getFestivalName = (key: string) => {
    const f = FESTIVAL_OPTIONS.find((f) => f.key === key);
    return f ? f[lang] : key;
  };
  // Helper: get color theme display name
  const getColorThemeName = (key: string) => {
    const ct = COLOR_THEMES.find((c) => c.key === key);
    return ct ? ct[lang] : key;
  };
  // Helper: get color theme colors
  const getColorThemeColors = (
    key: string,
  ): [string, string, string] | null => {
    const ct = COLOR_THEMES.find((c) => c.key === key);
    return ct ? ct.colors : null;
  };
  // Helper: get interactive effect display name
  const getInteractiveName = (effect: string) => {
    const map: Record<string, string> = {
      none: t.interactiveNone,
      flipOpen: t.interactiveFlipOpen,
      flipBack: t.interactiveFlipBack,
      escapeBtn: t.interactiveEscapeBtn,
      popOver: t.interactivePopOver,
    };
    return map[effect] || effect;
  };
  // Helper: get decoration display names
  const getDecorationNames = (keys: string[]) => {
    if (keys.length === 0) return lang === "zh" ? "無" : "None";
    const allDecos = Object.values(DECORATION_BY_FESTIVAL).flat();
    return keys
      .map((k) => {
        const d = allDecos.find((d) => d.key === k);
        return d ? d[lang] : k;
      })
      .join(", ");
  };

  function renderSidebar() {
    if (!vm.isMenuOpen) return null;
    return (
      <div className="menuOverlay" onClick={() => vm.setIsMenuOpen(false)}>
        <aside className="sideMenu" onClick={(e) => e.stopPropagation()}>
          <div className="menuHeader">
            <div className="brand">SyncHeartist</div>
            <button
              className="closeBtn"
              onClick={() => vm.setIsMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="menuLinks">
            <button
              className={vm.activePage === "home" ? "active" : ""}
              onClick={() => vm.navigateTo("home")}
            >
              {t.navHome}
            </button>
            <button
              className={vm.activePage === "create" ? "active" : ""}
              onClick={() => vm.navigateTo("create")}
            >
              {t.navCreate}
            </button>
            <button
              className={vm.activePage === "history" ? "active" : ""}
              onClick={() => vm.navigateTo("history")}
            >
              {t.navHist}
            </button>
            <button
              className={vm.activePage === "credits" ? "active" : ""}
              onClick={() => vm.navigateTo("credits")}
            >
              {t.navCred}
            </button>
          </nav>
          <div className="languageToggle">
            <div className="langLabel">{t.langTitle}</div>
            <div className="langRow">
              <button
                className={vm.locale === "zh" ? "active" : ""}
                onClick={() => vm.setLocale("zh")}
              >
                繁體
              </button>
              <button
                className={vm.locale === "en" ? "active" : ""}
                onClick={() => vm.setLocale("en")}
              >
                EN
              </button>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            {vm.isLoggedIn ? (
              <button className="ghost fullWidth" onClick={vm.handleLogout}>
                {t.authLogout}
              </button>
            ) : (
              <button
                className="primary fullWidth"
                onClick={() => vm.navigateTo("login")}
              >
                {t.btnLogin}
              </button>
            )}
          </div>
        </aside>
      </div>
    );
  }

  function renderHome() {
    return (
      <section className="heroPanel">
        <div className="heroGallery">
          <div className="iconStack">
            <div className="webIcon pic1">
              <div className="mockHeader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockBody">
                <div className="mockImg">🎂</div>
                <div className="mockText"></div>
              </div>
            </div>
            <div className="webIcon pic2">
              <div className="mockHeader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockBody">
                <div className="mockImg">❤️</div>
                <div className="mockText"></div>
              </div>
            </div>
            <div className="webIcon pic3">
              <div className="mockHeader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockBody">
                <div className="mockImg">🎄</div>
                <div className="mockText"></div>
              </div>
            </div>
          </div>
        </div>
        <h1 className="heroTitle">{t.heroTitle}</h1>
        <p className="heroSub">{t.heroSubtitle}</p>
        <button
          className="large primary"
          onClick={() => vm.navigateTo("create")}
        >
          {t.btnStart}
        </button>
      </section>
    );
  }

  function renderLogin() {
    return (
      <section className="panel center">
        <h2>{t.authTitle}</h2>
        <p className="lead">{t.authSubtitle}</p>
        <div className="socialAuth">
          <button className="socialBtn google" onClick={vm.handleGoogleLogin}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t.authBtnGoogle}
          </button>
        </div>
      </section>
    );
  }

  function renderCreate() {
    return (
      <section className="panel">
        <h2>{t.createTitle}</h2>
        <form onSubmit={vm.handleCreateSubmit}>
          {/* Recipient Name - placed at the very top */}
          <fieldset>
            <legend>{t.recipientName}</legend>
            <input
              type="text"
              placeholder={t.recipientNamePlaceholder}
              value={vm.recipientName}
              onChange={(e) => vm.setRecipientName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #f0d0e0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                background: "#fffbfd",
              }}
            />
          </fieldset>
          {/* Photo Upload */}
          <fieldset>
            <legend>{t.createPhoto}</legend>
            {vm.imagePreviewUrl ? (
              <div className="imagePreviewContainer">
                <img
                  src={vm.imagePreviewUrl}
                  alt="preview"
                  className="imagePreview"
                />
                <button
                  type="button"
                  className="removeImageBtn"
                  onClick={vm.removeImage}
                >
                  {t.deletePhoto}
                </button>
              </div>
            ) : (
              <label className="uploadArea">
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hiddenFileInput"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      vm.setImageFileName(file.name);
                      vm.setImageFile(file);
                    }
                  }}
                />
                <div className="uploadContent">
                  <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>{t.uploadBtnText}</span>
                </div>
              </label>
            )}
          </fieldset>
          {/* Interactive Effects */}
          <fieldset>
            <legend>
              {t.createInteractive}{" "}
              <span className="costBadge">
                {vm.interactiveEffect !== "none" ? t.interactiveCost : ""}
              </span>
            </legend>
            <p className="fieldDesc">{t.interactiveDesc}</p>
            <div className="optionsGrid">
              <button
                type="button"
                className={vm.interactiveEffect === "none" ? "active" : ""}
                onClick={() => vm.setInteractiveEffect("none")}
              >
                {t.interactiveNone}
              </button>
              <button
                type="button"
                className={vm.interactiveEffect === "flipOpen" ? "active" : ""}
                onClick={() => vm.setInteractiveEffect("flipOpen")}
              >
                {t.interactiveFlipOpen}
              </button>
              <button
                type="button"
                className={vm.interactiveEffect === "flipBack" ? "active" : ""}
                onClick={() => vm.setInteractiveEffect("flipBack")}
              >
                {t.interactiveFlipBack}
              </button>
              <button
                type="button"
                className={vm.interactiveEffect === "escapeBtn" ? "active" : ""}
                onClick={() => vm.setInteractiveEffect("escapeBtn")}
              >
                {t.interactiveEscapeBtn}
              </button>
              <button
                type="button"
                className={vm.interactiveEffect === "popOver" ? "active" : ""}
                onClick={() => vm.setInteractiveEffect("popOver")}
              >
                {t.interactivePopOver}
              </button>
            </div>
          </fieldset>
          {/* Escape Button Custom Fields */}
          {vm.interactiveEffect === "escapeBtn" && (
            <fieldset className="subFieldset">
              <div className="subField">
                <label>{t.escapeQuestion}</label>
                <input
                  type="text"
                  value={vm.escapeQuestion}
                  onChange={(e) => vm.setEscapeQuestion(e.target.value)}
                  placeholder={t.escapeQuestionPlaceholder}
                />
              </div>
              <div className="subField">
                <label>{t.escapeAcceptText}</label>
                <input
                  type="text"
                  value={vm.escapeAcceptText}
                  onChange={(e) => vm.setEscapeAcceptText(e.target.value)}
                  placeholder={t.escapeAcceptPlaceholder}
                />
              </div>
              <div className="subField">
                <label>{t.escapeRejectText}</label>
                <input
                  type="text"
                  value={vm.escapeRejectText}
                  onChange={(e) => vm.setEscapeRejectText(e.target.value)}
                  placeholder={t.escapeRejectPlaceholder}
                />
              </div>
            </fieldset>
          )}
          {/* Pop-over Custom Fields */}
          {vm.interactiveEffect === "popOver" && (
            <fieldset className="subFieldset">
              <div className="subField">
                <label>{t.popOverBtnText}</label>
                <input
                  type="text"
                  value={vm.popOverBtnText}
                  onChange={(e) => vm.setPopOverBtnText(e.target.value)}
                  placeholder={t.popOverBtnPlaceholder}
                />
              </div>
              <div className="subField">
                <label>{t.popOverMessage}</label>
                <textarea
                  rows={3}
                  value={vm.popOverMessage}
                  onChange={(e) => vm.setPopOverMessage(e.target.value)}
                  placeholder={t.popOverMessagePlaceholder}
                />
              </div>
            </fieldset>
          )}
          {/* Occasion / Festival */}
          <fieldset>
            <legend>{t.createFestival}</legend>
            <div className="optionsGrid">
              {FESTIVAL_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={vm.festival === f.key ? "active" : ""}
                  onClick={() => vm.setFestival(f.key)}
                >
                  {f[lang]}
                </button>
              ))}
            </div>
          </fieldset>
          {/* Color Theme */}
          <fieldset>
            <legend>{t.createColorTheme}</legend>
            <div className="colorThemeGrid">
              {COLOR_THEMES.map((ct) => (
                <button
                  key={ct.key}
                  type="button"
                  className={`colorThemeBtn ${vm.colorTheme === ct.key ? "active" : ""}`}
                  onClick={() => vm.setColorTheme(ct.key)}
                >
                  <div className="colorSwatches">
                    {ct.key === "custom" ? (
                      <span className="customColorIcon">🎨</span>
                    ) : (
                      ct.colors.map((c, i) => (
                        <span
                          key={i}
                          className="colorSwatch"
                          style={{ backgroundColor: c }}
                        ></span>
                      ))
                    )}
                  </div>
                  <span className="colorThemeName">{ct[lang]}</span>
                </button>
              ))}
            </div>
            {/* Custom Color Pickers */}
            {vm.colorTheme === "custom" && (
              <div className="customColorPickers">
                <div className="colorPickerField">
                  <label>{t.customColor1}</label>
                  <input
                    type="color"
                    value={vm.customColor1}
                    onChange={(e) => vm.setCustomColor1(e.target.value)}
                  />
                </div>
                <div className="colorPickerField">
                  <label>{t.customColor2}</label>
                  <input
                    type="color"
                    value={vm.customColor2}
                    onChange={(e) => vm.setCustomColor2(e.target.value)}
                  />
                </div>
                <div className="colorPickerField">
                  <label>{t.customColor3}</label>
                  <input
                    type="color"
                    value={vm.customColor3}
                    onChange={(e) => vm.setCustomColor3(e.target.value)}
                  />
                </div>
              </div>
            )}
            {/* Gradient Checkbox */}
            <label className="gradientCheckbox" style={{ marginTop: "12px" }}>
              <input
                type="checkbox"
                checked={vm.useGradient}
                onChange={(e) => vm.setUseGradient(e.target.checked)}
              />
              {t.createColorGradient}
            </label>
          </fieldset>
          {/* Decorations */}
          <fieldset>
            <legend>{t.createDecorations}</legend>
            <div className="optionsGrid">
              {(DECORATION_BY_FESTIVAL[vm.festival] || []).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className={vm.decorations.includes(d.key) ? "active" : ""}
                  onClick={() => vm.toggleDecoration(d.key)}
                >
                  {d[lang]}
                </button>
              ))}
            </div>
          </fieldset>
          {/* Blessing */}
          <fieldset>
            <legend>{t.createBlessing}</legend>
            <textarea
              placeholder={t.createBlessingPlaceholder}
              rows={4}
              value={vm.blessing}
              onChange={(e) => vm.setBlessing(e.target.value)}
            ></textarea>
          </fieldset>
          {/* Card Label */}
          <fieldset>
            <legend>{t.cardLabel}</legend>
            <input
              type="text"
              placeholder={t.cardLabelPlaceholder}
              value={vm.cardLabel}
              onChange={(e) => vm.setCardLabel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #f0d0e0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                background: "#fffbfd",
              }}
            />
          </fieldset>
          {/* Card Language */}
          <fieldset>
            <legend>{t.cardLanguage}</legend>
            <div
              className="optionsGrid"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              <button
                type="button"
                className={vm.cardLanguage === "zh" ? "active" : ""}
                onClick={() => vm.setCardLanguage("zh")}
              >
                {t.cardLanguageZh}
              </button>
              <button
                type="button"
                className={vm.cardLanguage === "en" ? "active" : ""}
                onClick={() => vm.setCardLanguage("en")}
              >
                {t.cardLanguageEn}
              </button>
            </div>
          </fieldset>
          {/* Cost & Submit */}
          <div className="formFooter">
            <div className="costInfo">
              <div className="costLabel">
                {t.createCostReq} <strong>{vm.estimatedCost}</strong>{" "}
                {t.createCostPts}
              </div>
              <div className="balanceLabel">
                {t.createCostRem} {vm.credits} {t.createCostPts}
              </div>
            </div>
            <button
              type="submit"
              className="large primary fullWidth"
              disabled={vm.isGenerating || !vm.blessing.trim()}
            >
              {vm.isGenerating
                ? vm.isUploading
                  ? t.uploadingText
                  : t.createBtnGenLoading
                : t.createBtnGen}
            </button>
            {!vm.blessing.trim() && (
              <p
                style={{
                  color: "#e57373",
                  fontSize: "0.85rem",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                {t.alertNoBlessing}
              </p>
            )}
          </div>
        </form>
        {/* Confirmation Popup */}
        {vm.showConfirmPopup && (
          <div
            className="modalOverlay"
            onClick={() => vm.setShowConfirmPopup(false)}
          >
            <div
              className="modalContent confirmModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modalHeader">
                <span className="modalIcon">📋</span>
                <h3>{t.confirmTitle}</h3>
              </div>
              <p style={{ marginBottom: "16px", color: "#a56a87" }}>
                {t.confirmDesc}
              </p>
              <div className="confirmSummary">
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmFestival}</span>
                  <span className="confirmValue">
                    {getFestivalName(vm.festival)}
                  </span>
                </div>
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmColorTheme}</span>
                  <span className="confirmValue">
                    <span className="confirmColorSwatches">
                      {vm.colorTheme === "custom" ? (
                        <>
                          <span
                            className="miniSwatch"
                            style={{ backgroundColor: vm.customColor1 }}
                          ></span>
                          <span
                            className="miniSwatch"
                            style={{ backgroundColor: vm.customColor2 }}
                          ></span>
                          <span
                            className="miniSwatch"
                            style={{ backgroundColor: vm.customColor3 }}
                          ></span>
                        </>
                      ) : (
                        (getColorThemeColors(vm.colorTheme) || []).map(
                          (c, i) => (
                            <span
                              key={i}
                              className="miniSwatch"
                              style={{ backgroundColor: c }}
                            ></span>
                          ),
                        )
                      )}
                    </span>
                    {getColorThemeName(vm.colorTheme)}
                    {vm.useGradient ? ` (${t.createColorGradient})` : ""}
                  </span>
                </div>
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmDecorations}</span>
                  <span className="confirmValue">
                    {getDecorationNames(vm.decorations)}
                  </span>
                </div>
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmInteractive}</span>
                  <span className="confirmValue">
                    {getInteractiveName(vm.interactiveEffect)}
                  </span>
                </div>
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmPhoto}</span>
                  <span className="confirmValue">
                    {vm.imageFile ? t.confirmPhotoYes : t.confirmPhotoNo}
                  </span>
                </div>
                <div className="confirmRow">
                  <span className="confirmLabel">{t.confirmBlessing}</span>
                  <span className="confirmValue blessingPreview">
                    {vm.blessing.length > 80
                      ? vm.blessing.substring(0, 80) + "..."
                      : vm.blessing}
                  </span>
                </div>
                <div className="confirmRow highlight">
                  <span className="confirmLabel">{t.confirmCost}</span>
                  <span className="confirmValue">
                    <strong>{vm.estimatedCost}</strong> {t.createCostPts}
                  </span>
                </div>
              </div>
              <div className="modalActions">
                <button
                  className="ghost"
                  onClick={() => vm.setShowConfirmPopup(false)}
                >
                  {t.confirmCancel}
                </button>
                <button className="primary" onClick={vm.handleConfirmedSubmit}>
                  {t.confirmSubmit}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Loading Popup */}
        {vm.isGenerating && (
          <div className="modalOverlay loadingOverlay">
            <div className="modalContent loadingModal">
              <div className="loadingAnimation">
                <div className="heartBeat">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <path
                      d="M50 88 C25 65 5 50 5 30 C5 15 18 5 33 5 C40 5 47 9 50 15 C53 9 60 5 67 5 C82 5 95 15 95 30 C95 50 75 65 50 88Z"
                      fill="#ff6b9d"
                      className="heartPath"
                    />
                  </svg>
                </div>
                <div className="loadingDots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <h3 className="loadingTitle">{t.loadingTitle}</h3>
              <p className="loadingSubtitle">{t.loadingSubtitle}</p>
            </div>
          </div>
        )}
        {/* Success Popup */}
        {vm.showSuccessPopup && (
          <div className="modalOverlay" onClick={() => vm.closeSuccessPopup()}>
            <div
              className="modalContent successModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modalHeader">
                <span className="modalIcon">🎉</span>
                <h3>{t.popupTitle}</h3>
              </div>
              <p>{t.popupDesc}</p>
              <div className="shareLinkBox">
                <input
                  type="text"
                  readOnly
                  value={vm.generatedShareLink}
                  className="shareLinkInput"
                />
                <button
                  type="button"
                  className="copyBtn"
                  onClick={vm.copyShareLink}
                >
                  {vm.linkCopied ? t.popupCopied : t.popupCopy}
                </button>
              </div>
              <div className="modalActions">
                <button
                  className="ghost"
                  onClick={() => window.open(vm.generatedShareLink, "_blank")}
                >
                  {t.popupPreview}
                </button>
                <button
                  className="primary"
                  onClick={() => vm.closeSuccessPopup()}
                >
                  {t.popupClose}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Error Popup */}
        {vm.error && (
          <div className="modalOverlay" onClick={() => vm.setError(null)}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <span className="modalIcon">
                  {vm.error.includes("點數不足") ||
                  vm.error.includes("Insufficient")
                    ? "💳"
                    : "⚠️"}
                </span>
                <h3>
                  {vm.error.includes("點數不足") ||
                  vm.error.includes("Insufficient")
                    ? t.errorCreditsTitle
                    : t.errorTitle}
                </h3>
              </div>
              <p>
                {vm.error.includes("點數不足") ||
                vm.error.includes("Insufficient")
                  ? t.alertNoCredits
                  : vm.error.includes("Upload")
                    ? t.errorUploadMsg
                    : t.errorGenericMsg}
              </p>
              <div className="modalActions">
                {(vm.error.includes("點數不足") ||
                  vm.error.includes("Insufficient")) && (
                  <button
                    className="ghost"
                    onClick={() => {
                      vm.setError(null);
                      vm.navigateTo("credits");
                    }}
                  >
                    {t.errorCreditsBtn}
                  </button>
                )}
                <button className="primary" onClick={() => vm.setError(null)}>
                  {t.errorOk}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderCredits() {
    return (
      <section className="panel">
        <h2 className="center">{t.creditsTitle}</h2>
        <div className="grid three" style={{ marginTop: "24px" }}>
          <article className="card center relative">
            <div className="badge trial">{t.trialBadge}</div>
            <h3>25 {t.createCostPts}</h3>
            <p className="price">HK$ 8</p>
            <button
              className="ghost fullWidth"
              onClick={() => vm.handlePurchase(25, 8)}
            >
              {t.creditsBuy}
            </button>
          </article>
          <article className="card center relative">
            <div className="badge popular">{t.popularBadge}</div>
            <h3>125 {t.createCostPts}</h3>
            <p className="price">HK$ 28</p>
            <button
              className="fullWidth"
              onClick={() => vm.handlePurchase(125, 28)}
            >
              {t.creditsBuy}
            </button>
          </article>
          <article className="card center relative highlight">
            <div className="badge discount">{t.saveBadge}</div>
            <h3>400 {t.createCostPts}</h3>
            <p className="price">HK$ 88</p>
            <button
              className="primary fullWidth"
              onClick={() => vm.handlePurchase(400, 88)}
            >
              {t.creditsBuy}
            </button>
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
          <div className="emptyState center" style={{ padding: "40px 0" }}>
            <p className="lead">{t.histEmpty}</p>
            <button className="primary" onClick={() => vm.navigateTo("create")}>
              {t.navCreate}
            </button>
          </div>
        ) : (
          <div className="historyList">
            {vm.history.map((item) => {
              // Parse color meta for display
              let colorSwatches: string[] = [];
              try {
                if (item.colorMeta) {
                  const meta = JSON.parse(item.colorMeta);
                  colorSwatches = meta.colors || [];
                }
              } catch {}
              // Determine display label
              const displayLabel =
                item.cardLabel && item.cardLabel.trim()
                  ? item.cardLabel
                  : t.histNoLabel;
              // Truncate blessing for preview
              const blessingPreview = item.blessingText
                ? item.blessingText.length > 40
                  ? item.blessingText.substring(0, 40) + "..."
                  : item.blessingText
                : "";
              return (
                <article key={item.id} className="card historyCard">
                  <div className="historyCardTop">
                    <div className="historyLabelRow">
                      <h4 className="historyLabel">{displayLabel}</h4>
                      {colorSwatches.length > 0 && (
                        <div className="historyColorSwatches">
                          {colorSwatches.map((c, i) => (
                            <span
                              key={i}
                              className="miniSwatch"
                              style={{ backgroundColor: c }}
                            ></span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="historyMeta">
                      <span className="historyFestival">
                        {getFestivalName(item.festivalKey)}
                      </span>
                      <span className="historyDate">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {blessingPreview && (
                      <p className="historyBlessing">{blessingPreview}</p>
                    )}
                  </div>
                  <div className="historyActions">
                    <button
                      className="small ghost historyViewBtn"
                      onClick={() =>
                        window.open(
                          `https://api.syncheartist.com/view/${item.id}`,
                          "_blank",
                        )
                      }
                    >
                      {t.histLink}
                    </button>
                    <button
                      className="small editBtn"
                      onClick={() =>
                        vm.startEditCard(
                          item.id,
                          `https://api.syncheartist.com/view/${item.id}`,
                        )
                      }
                    >
                      ✏️ {t.editBtn}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderPaymentSuccess() {
    return (
      <section className="panel center">
        <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
        <h2>{t.payTitle}</h2>
        <p className="lead">{t.payDesc}</p>
        <button
          className="large primary"
          onClick={() => vm.navigateTo("create")}
        >
          {t.payBtnBack}
        </button>
      </section>
    );
  }

  return (
    <div className="appRoot">
      <header className="topBar">
        <div className="navLeft">
          <button className="menuBtn" onClick={() => vm.setIsMenuOpen(true)}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="brand" onClick={() => vm.navigateTo("home")}>
            SyncHeartist
          </div>
        </div>
        <div className="creditBadge" onClick={() => vm.navigateTo("credits")}>
          {vm.credits} {t.createCostPts}
        </div>
      </header>
      {renderSidebar()}

      {/* Welcome Popup for New Users */}
      {vm.showWelcomePopup && (
        <div className="modalOverlay welcomeOverlay">
          <div
            className="modalContent welcomeModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="welcomeIcon">🎁</div>
            <h3 className="welcomeTitle">{t.welcomeTitle}</h3>
            <div className="welcomeCreditsBox">
              <span className="welcomeCreditsNum">10</span>
              <span className="welcomeCreditsLabel">{t.welcomeCredits}</span>
            </div>
            <p className="welcomeDesc">{t.welcomeDesc}</p>
            <button
              className="large primary fullWidth"
              onClick={() => {
                vm.setShowWelcomePopup(false);
                vm.navigateTo("create");
              }}
            >
              {t.welcomeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Edit Card Popup - Input instruction */}
      {vm.showEditPopup && (
        <div className="modalOverlay" onClick={() => vm.cancelEdit()}>
          <div
            className="modalContent editModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <span className="modalIcon">✏️</span>
              <h3>{t.editTitle}</h3>
            </div>
            <p style={{ marginBottom: "16px", color: "#a56a87" }}>
              {t.editDesc}
            </p>
            <textarea
              className="editTextarea"
              rows={4}
              value={vm.editInstruction}
              onChange={(e) => vm.setEditInstruction(e.target.value)}
              placeholder={t.editPlaceholder}
            />
            <div className="modalActions">
              <button className="ghost" onClick={() => vm.cancelEdit()}>
                {t.editCancel}
              </button>
              <button
                className="primary"
                onClick={vm.submitEditCard}
                disabled={!vm.editInstruction.trim()}
              >
                {t.editSubmit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Loading */}
      {vm.isEditing && (
        <div className="modalOverlay loadingOverlay">
          <div className="modalContent loadingModal">
            <div className="loadingAnimation">
              <div className="heartBeat">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <path
                    d="M50 88 C25 65 5 50 5 30 C5 15 18 5 33 5 C40 5 47 9 50 15 C53 9 60 5 67 5 C82 5 95 15 95 30 C95 50 75 65 50 88Z"
                    fill="#ff6b9d"
                    className="heartPath"
                  />
                </svg>
              </div>
              <div className="loadingDots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h3 className="loadingTitle">{t.editLoading}</h3>
            <p className="loadingSubtitle">{t.editLoadingSubtitle}</p>
          </div>
        </div>
      )}

      {/* Edit Card Preview - Compare old vs new */}
      {vm.showEditPreview && (
        <div className="modalOverlay" onClick={() => vm.cancelEdit()}>
          <div
            className="modalContent editPreviewModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <span className="modalIcon">🔍</span>
              <h3>{t.editPreviewTitle}</h3>
            </div>
            <p style={{ marginBottom: "16px", color: "#a56a87" }}>
              {t.editPreviewDesc}
            </p>
            <div className="editPreviewCompare">
              <div className="previewPane">
                <h4>{t.editPreviewOriginal}</h4>
                <div className="previewFrame">
                  <iframe src={vm.editOriginalLink} title="Original" />
                </div>
              </div>
              <div className="previewPane">
                <h4>{t.editPreviewNew}</h4>
                <div className="previewFrame">
                  <iframe src={vm.editPreviewLink} title="New Version" />
                </div>
              </div>
            </div>
            <div className="modalActions">
              <button
                className="ghost"
                onClick={() => vm.confirmEditCard(false)}
              >
                {t.editKeepOld}
              </button>
              <button
                className="primary"
                onClick={() => vm.confirmEditCard(true)}
              >
                {t.editKeepNew}
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {vm.activePage === "home" && renderHome()}
        {vm.activePage === "login" && renderLogin()}
        {vm.activePage === "create" && renderCreate()}
        {vm.activePage === "credits" && renderCredits()}
        {vm.activePage === "history" && renderHistory()}
        {vm.activePage === "payment-success" && renderPaymentSuccess()}
      </main>
    </div>
  );
}
