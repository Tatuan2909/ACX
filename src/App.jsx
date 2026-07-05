import React, { useEffect, useRef, useState } from "react";
import {
  Menu, X, ArrowRight, ArrowUpRight, Check, Sun, ShieldCheck,
  Gauge, Sparkles, PhoneCall, Mail, MapPin, ChevronDown,
  Facebook, Instagram, Linkedin, Zap, User, Lock, Eye, EyeOff, LogOut, Loader2,
  ShoppingBag, Wallet, Copy, Clock3, AlertTriangle
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* =========================================================================
   ACX — Premium Panel Store
   Design tokens
   Color   #0A0A0C bg-primary · #141416 bg-secondary · #1B1B1E bg-elevated
           #F5F5F2 text-primary · #9C9C A1 text-muted (see CSS) · #C9A227 accent (metal gold)
           #E8C468 accent-soft · rgba(255,255,255,.08) border
   Type    Display: "Space Grotesk" · Body: "Inter" · Mono/specs: "IBM Plex Mono"
   Signature: the "Cell Grid" — a lattice of small cells that light up in
   sequence, echoing a panel powering on. Used in the hero, as a section
   divider, and as a hover state on product cards.
   =========================================================================*/

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* --- Signature Cell Grid ------------------------------------------------ */
function CellGrid({ rows = 6, cols = 10, className = "" }) {
  const cells = Array.from({ length: rows * cols });
  return (
    <div
      className={`cellgrid ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-hidden="true"
    >
      {cells.map((_, i) => (
        <span
          key={i}
          className="cellgrid__cell"
          style={{ animationDelay: `${(i % (cols + rows)) * 90}ms` }}
        />
      ))}
    </div>
  );
}

/* --- Auth Modal (Login / Sign Up popup, wired to Supabase Auth) ---------- */
function AuthModal({ open, mode, onClose, onModeChange }) {
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const isLogin = mode === "login";

  // Reset transient state whenever the popup opens or the tab changes
  useEffect(() => {
    setErrorMsg("");
    setConfirmSent(false);
    setLoading(false);
  }, [open, mode]);

  // Lock page scroll while the popup is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!isLogin && password !== password2) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      onClose();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      // Supabase sends a confirmation email by default — show that state
      // instead of assuming the account is immediately active.
      setConfirmSent(true);
    }
  }

  return (
    <div
      className="authmodal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="authmodal"
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? "Log in to ACX" : "Create an ACX account"}
      >
        <button className="authmodal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {confirmSent ? (
          <div className="authmodal__head authmodal__head--success">
            <span className="nav__logo-mark">A</span>
            <h3>Check your email</h3>
            <p>
              We've sent a confirmation link to <strong>{email}</strong>. Verify
              your address to finish creating your ACX account.
            </p>
            <button className="btn btn--solid authmodal__submit" onClick={onClose}>
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className="authmodal__head">
              <span className="nav__logo-mark">A</span>
              <h3>{isLogin ? "Welcome back" : "Create your ACX account"}</h3>
              <p>
                {isLogin
                  ? "Log in to track orders, monitor your panel system, and manage your account."
                  : "Sign up to shop faster, follow your installation, and monitor performance in one place."}
              </p>
            </div>

            <div className="authmodal__tabs">
              <button
                className={`authmodal__tab ${isLogin ? "authmodal__tab--active" : ""}`}
                onClick={() => onModeChange("login")}
                type="button"
              >
                Log In
              </button>
              <button
                className={`authmodal__tab ${!isLogin ? "authmodal__tab--active" : ""}`}
                onClick={() => onModeChange("register")}
                type="button"
              >
                Sign Up
              </button>
            </div>

            <form className="authmodal__form" onSubmit={handleSubmit}>
              {!isLogin && (
                <label className="authmodal__field">
                  <span>Full Name</span>
                  <div className="authmodal__input">
                    <User size={16} />
                    <input
                      type="text"
                      placeholder=""
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </label>
              )}

              <label className="authmodal__field">
                <span>Email</span>
                <div className="authmodal__input">
                  <Mail size={16} />
                  <input
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              {!isLogin && (
                <label className="authmodal__field">
                  <span>Phone Number</span>
                  <div className="authmodal__input">
                    <PhoneCall size={16} />
                    <input
                      type="tel"
                      placeholder=""
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </label>
              )}

              <label className="authmodal__field">
                <span>Password</span>
                <div className="authmodal__input">
                  <Lock size={16} />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="authmodal__eye"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {!isLogin && (
                <label className="authmodal__field">
                  <span>Confirm Password</span>
                  <div className="authmodal__input">
                    <Lock size={16} />
                    <input
                      type={showPw2 ? "text" : "password"}
                      placeholder=""
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="authmodal__eye"
                      onClick={() => setShowPw2((s) => !s)}
                      aria-label="Toggle password visibility"
                    >
                      {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              )}

              {isLogin ? (
                <a href="#" className="authmodal__forgot">
                  Forgot password?
                </a>
              ) : (
                <label className="authmodal__terms">
                  <input type="checkbox" required />
                  <span>I agree to ACX's Terms of Service and Privacy Policy.</span>
                </label>
              )}

              {errorMsg && <div className="authmodal__error">{errorMsg}</div>}

              <button
                type="submit"
                className="btn btn--solid authmodal__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="authmodal__spinner" />
                    {isLogin ? "Logging in…" : "Creating account…"}
                  </>
                ) : (
                  <>
                    {isLogin ? "Log In" : "Create Account"} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="authmodal__switch">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => onModeChange("register")}>
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => onModeChange("login")}>
                    Log In
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Buy Modal (product purchase popup with duration dropdown) ---------- */
function BuyModal({ product, pricingOptions, onClose, user, onAuthOpen, onPurchased }) {
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [licenseKey, setLicenseKey] = useState(null);
  const [keyError, setKeyError] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset transient state whenever a new product is opened
  useEffect(() => {
    setSelectedId(pricingOptions[0]?.id ?? null);
    setLoading(false);
    setSubmitted(false);
    setErrorMsg("");
    setLicenseKey(null);
    setKeyError("");
    setCopied(false);
  }, [product, pricingOptions]);

  // Lock page scroll while the popup is open
  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!product) return null;

  const current = pricingOptions.find((o) => o.id === selectedId) || pricingOptions[0];

  async function handleConfirm() {
    if (!user) {
      onClose();
      onAuthOpen("login");
      return;
    }
    if (!current) return;

    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.rpc("buy_product", {
      p_product_id: product.id,
      p_pricing_option_id: current.id,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // Order paid successfully — now ask the Edge Function to mint a license
    // key for it (calls the Google Apps Script key-management backend).
    const { data: keyRes, error: keyErr } = await supabase.functions.invoke(
      "issue-license-key",
      { body: { order_id: data.id } }
    );

    setLoading(false);

    if (keyErr || !keyRes?.success) {
      // The purchase itself succeeded (wallet already deducted) — only key
      // issuance failed, so don't show this as a failed purchase. Surface it
      // as a separate warning instead.
      setKeyError(
        keyRes?.message || keyErr?.message || "Không tạo được key tự động, vui lòng liên hệ hỗ trợ."
      );
    } else {
      setLicenseKey(keyRes.license_key);
    }

    setSubmitted(true);
    onPurchased?.();
  }

  function copyKey() {
    if (!licenseKey) return;
    navigator.clipboard?.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="authmodal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="authmodal buymodal"
        role="dialog"
        aria-modal="true"
        aria-label={`Mua ${product.name}`}
      >
        <button className="authmodal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="authmodal__head authmodal__head--success">
            <span className="nav__logo-mark">A</span>
            <h3>Đặt mua thành công</h3>
            <p>
              Bạn đã đặt mua <strong>{product.name}</strong> — gói{" "}
              <strong>{current.label}</strong> ({current.price.toLocaleString("vi-VN")}₫).
              Số tiền đã được trừ vào ví ACX của bạn.
            </p>

            {licenseKey ? (
              <div className="buymodal__key">
                <span>Key kích hoạt của bạn</span>
                <div className="buymodal__key-row">
                  <strong>{licenseKey}</strong>
                  <button type="button" className="sepay-panel__copy" onClick={copyKey}>
                    <Copy size={13} /> {copied ? "Đã chép" : "Chép"}
                  </button>
                </div>
                <p className="buymodal__key-note">
                  Lưu lại key này — bạn cũng có thể xem lại bất cứ lúc nào trong mục "Lịch sử mua hàng".
                </p>
              </div>
            ) : keyError ? (
              <div className="authmodal__error">
                Đơn hàng đã thanh toán thành công, nhưng chưa tạo được key tự động: {keyError} Vui
                lòng vào "Lịch sử mua hàng" để kiểm tra lại hoặc liên hệ hỗ trợ.
              </div>
            ) : null}

            <button className="btn btn--solid authmodal__submit" onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="authmodal__head">
              <span className="nav__logo-mark">A</span>
              <h3>{product.name}</h3>
              <p>Chọn thời hạn sử dụng bạn muốn mua.</p>
            </div>

            <div className="buymodal__field">
              <label htmlFor="buy-duration">Thời hạn sử dụng</label>
              <select
                id="buy-duration"
                className="buymodal__select"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {pricingOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} — {o.price.toLocaleString("vi-VN")}₫
                  </option>
                ))}
              </select>
            </div>

            <div className="buymodal__total">
              <span>Tổng thanh toán</span>
              <strong>{current ? current.price.toLocaleString("vi-VN") : 0}₫</strong>
            </div>

            {errorMsg && <div className="authmodal__error">{errorMsg}</div>}

            <button
              type="button"
              className="btn btn--solid authmodal__submit"
              disabled={loading || !current}
              onClick={handleConfirm}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="authmodal__spinner" />
                  Đang xử lý…
                </>
              ) : user ? (
                <>
                  Xác nhận mua <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Đăng nhập để mua <ArrowRight size={16} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Nav ------------------------------------------------------------------ */
function Nav({ onAuthOpen, user, onLogout, page, onNavigate, profile }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account dropdown when clicking outside of it
  useEffect(() => {
    function onClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const links = [
    { label: "Products", target: "home", scrollTo: "products" },
    { label: "Nạp tiền", target: "topup" },
    { label: "Lịch sử mua hàng", target: "history" },
  ];

  function handleLinkClick(l) {
    onNavigate(l.target, l.scrollTo);
    setOpen(false);
  }

  return (
    <header className={`nav ${scrolled ? "nav--solid" : ""}`}>
      <div className="nav__inner">
        <a
          href="#top"
          className="nav__logo"
          onClick={(e) => { e.preventDefault(); onNavigate("home", "top"); }}
        >
          <span className="nav__logo-mark">A</span>
          <span>ACX</span>
        </a>

        <nav className="nav__links">
          {links.map((l) => (
            <a
              key={l.label}
              href={`#${l.scrollTo || l.target}`}
              className={`nav__link ${page === l.target ? "nav__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); handleLinkClick(l); }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__cta-wrap">
          <div className="nav__account" ref={accountRef}>
            {user ? (
              <>
                <button
                  className="nav__icon-btn nav__icon-btn--active"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                >
                  {user.email?.[0]?.toUpperCase() || <User size={18} />}
                </button>

                {accountOpen && (
                  <div className="account-menu">
                    <div className="account-menu__head">
                      <span className="account-menu__avatar">
                        {user.email?.[0]?.toUpperCase()}
                      </span>
                      <div className="account-menu__id">
                        <strong>{user.user_metadata?.full_name || "ACX Member"}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>

                    <div className="account-menu__divider" />

                    <button
                      className="account-menu__item"
                      onClick={() => { onNavigate("history"); setAccountOpen(false); }}
                    >
                      <ShoppingBag size={16} />
                      <span>Purchase History</span>
                    </button>
                    <button
                      className="account-menu__item"
                      onClick={() => { onNavigate("topup"); setAccountOpen(false); }}
                    >
                      <Wallet size={16} />
                      <span>Wallet Balance</span>
                      <span className="account-menu__value">
                        {(profile?.wallet_balance ?? 0).toLocaleString("vi-VN")}₫
                      </span>
                    </button>

                    <div className="account-menu__divider" />

                    <button
                      className="account-menu__item account-menu__item--danger"
                      onClick={onLogout}
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                className="nav__icon-btn"
                onClick={() => onAuthOpen("login")}
                aria-label="Log in or sign up"
              >
                <User size={18} />
              </button>
            )}
          </div>
        </div>

        <button
          className="nav__burger"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav__mobile ${open ? "nav__mobile--open" : ""}`}>
        {links.map((l) => (
          <a
            key={l.label}
            href={`#${l.scrollTo || l.target}`}
            className={page === l.target ? "nav__link--active" : ""}
            onClick={(e) => { e.preventDefault(); handleLinkClick(l); }}
          >
            {l.label}
          </a>
        ))}
        {user ? (
          <div className="nav__mobile-account">
            <div className="account-menu__head">
              <span className="account-menu__avatar">{user.email?.[0]?.toUpperCase()}</span>
              <div className="account-menu__id">
                <strong>{user.user_metadata?.full_name || "ACX Member"}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <div className="account-menu__divider" />
            <button
              className="account-menu__item"
              onClick={() => { onNavigate("history"); setOpen(false); }}
            >
              <ShoppingBag size={16} />
              <span>Purchase History</span>
            </button>
            <button
              className="account-menu__item"
              onClick={() => { onNavigate("topup"); setOpen(false); }}
            >
              <Wallet size={16} />
              <span>Wallet Balance</span>
              <span className="account-menu__value">
                {(profile?.wallet_balance ?? 0).toLocaleString("vi-VN")}₫
              </span>
            </button>
            <div className="account-menu__divider" />
            <button
              className="account-menu__item account-menu__item--danger"
              onClick={() => { onLogout(); setOpen(false); }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="nav__mobile-auth">
            <button
              className="btn btn--outline"
              onClick={() => { onAuthOpen("login"); setOpen(false); }}
            >
              Log In
            </button>
            <button
              className="btn btn--solid"
              onClick={() => { onAuthOpen("register"); setOpen(false); }}
            >
              Sign Up
            </button>
          </div>
        )}
        <a href="#contact" className="btn btn--outline" onClick={() => setOpen(false)}>
          Get a Free Consultation
        </a>
      </div>
    </header>
  );
}

/* --- Hero ------------------------------------------------------------------ */
function Hero() {
  return (
    <section id="top" className="hero">
      <CellGrid rows={7} cols={14} className="hero__grid" />
      <div className="hero__scrim" />

      <div className="hero__content">
        <Reveal className="eyebrow">
          <Zap size={14} /> ACX PANEL STORE — VIETNAM
        </Reveal>

        <Reveal as="h1" delay={80} className="hero__title">
          Cung Cấp Phần Mềm Hỗ Trợ Full Đỏ.
          <br />
        </Reveal>

        <Reveal delay={160} className="hero__sub">
          <span className="hero__sub-line">ACX là nền tảng công nghệ hiện đại chuyên cung cấp giải pháp "full đỏ" đỉnh cao cho cộng đồng game thủ Free Fire.</span>
          <span className="hero__sub-line">Không chỉ dừng lại ở kho vật phẩm đồ sộ, trang web còn khẳng định uy tín nhờ hệ thống giao dịch tự động siêu tốc và cam kết bảo mật tài khoản an toàn 100%.</span>
        </Reveal>

        <Reveal delay={240} className="hero__actions">
          <a href="#pricing" className="btn btn--solid btn--lg">
            Buy Now <ArrowRight size={18} />
          </a>
          <a href="#contact" className="btn btn--outline btn--lg">
            Free Product
          </a>
        </Reveal>

        <Reveal delay={320} className="hero__stats">
          <div>
            <strong>12,400+</strong>
            <span>Panels installed nationwide</span>
          </div>
          <div>
            <strong>25-Year</strong>
            <span>Performance warranty</span>
          </div>
          <div>
            <strong>4.9 / 5</strong>
            <span>Average client rating</span>
          </div>
        </Reveal>
      </div>

      <a href="#about" className="hero__scroll" aria-label="Scroll to learn more">
        <ChevronDown size={20} />
      </a>
    </section>
  );
}



/* --- Products ---------------------------------------------------------------- */
function Products({ user, onAuthOpen, onWalletChange }) {
  const [items, setItems] = useState([]);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [buyProduct, setBuyProduct] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      const [productsRes, pricingRes] = await Promise.all([
        supabase.from("products").select("*").order("sort_order", { ascending: true }),
        supabase.from("pricing_options").select("*").order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;

      if (productsRes.error || pricingRes.error) {
        setLoadError(
          productsRes.error?.message || pricingRes.error?.message || "Không tải được dữ liệu sản phẩm."
        );
        setLoading(false);
        return;
      }

      setItems(productsRes.data || []);
      setPricingOptions(pricingRes.data || []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function handlePurchased() {
    onWalletChange?.();
  }

  return (
    <section id="products" className="section section--muted">
      <div className="container">
        <Reveal className="eyebrow">PRODUCTS</Reveal>
        <Reveal as="h2" delay={80} className="section__title">
          Tại ACX, chúng tôi mang đến bộ đôi sản phẩm quyền lực giúp bạn dễ dàng làm chủ mọi trận đấu sinh tồn.
        </Reveal>

        {loading ? (
          <div className="products-state">
            <Loader2 size={22} className="authmodal__spinner" />
            <span>Đang tải sản phẩm…</span>
          </div>
        ) : loadError ? (
          <div className="products-state products-state--error">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="products-state">Chưa có sản phẩm nào.</div>
        ) : (
          <div className="products">
            {items.map((item, i) => (
              <Reveal
                key={item.id}
                delay={i * 100}
                className={`product-card ${item.featured ? "product-card--featured" : ""}`}
              >
                {item.featured && <span className="product-card__badge">Best Seller</span>}
                <span className="product-card__tag">{item.tag}</span>
                <h3>{item.name}</h3>
                <p className="product-card__desc">{item.description}</p>
                <ul>
                  {(item.benefits || []).map((b) => (
                    <li key={b}>
                      <Check size={16} /> {b}
                    </li>
                  ))}
                </ul>
                <div className="product-card__img-wrap">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="product-card__img" />
                    : <div className="product-card__img-placeholder"><span>Chưa có hình ảnh</span></div>
                  }
                </div>
                <div className="product-card__foot">
                  <strong>{Number(item.base_price).toLocaleString("vi-VN")}₫</strong>
                  <button
                    type="button"
                    className="btn btn--sm product-card__buy-btn"
                    onClick={() => setBuyProduct(item)}
                  >
                    Buy Now <ArrowUpRight size={14} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <BuyModal
        product={buyProduct}
        pricingOptions={pricingOptions}
        onClose={() => setBuyProduct(null)}
        user={user}
        onAuthOpen={onAuthOpen}
        onPurchased={handlePurchased}
      />
    </section>
  );
}





/* --- Purchase History Page ---------------------------------------------------- */
function PurchaseHistoryPage({ user, onAuthOpen, refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("orders")
        .select("id, product_name, duration_label, amount, status, created_at, license_key")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setLoadError(error.message);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  const statusLabel = {
    completed: "Hoàn thành",
    pending: "Đang xử lý",
    failed: "Thất bại",
  };

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("vi-VN");
  }

  function OrderKeyCell({ value }) {
    const [copied, setCopied] = useState(false);
    if (!value) return <span className="order-table__sub">—</span>;
    return (
      <span className="order-table__key">
        <span className="order-table__key-value">{value}</span>
        <button
          type="button"
          className="sepay-panel__copy"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy size={12} /> {copied ? "Đã chép" : "Chép"}
        </button>
      </span>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <Reveal className="eyebrow">
          <ShoppingBag size={14} /> TÀI KHOẢN CỦA BẠN
        </Reveal>
        <Reveal as="h1" delay={80} className="page-section__title">
          Lịch sử mua hàng
        </Reveal>
        <Reveal delay={140} className="page-section__lede">
          Theo dõi toàn bộ đơn hàng và trạng thái giao dịch bạn đã thực hiện tại ACX.
        </Reveal>

        {!user ? (
          <Reveal delay={200} className="empty-state">
            <p>Vui lòng đăng nhập để xem lịch sử mua hàng của bạn.</p>
            <button className="btn btn--solid" onClick={() => onAuthOpen("login")}>
              Đăng nhập <ArrowRight size={16} />
            </button>
          </Reveal>
        ) : loading ? (
          <div className="products-state">
            <Loader2 size={22} className="authmodal__spinner" />
            <span>Đang tải lịch sử mua hàng…</span>
          </div>
        ) : loadError ? (
          <div className="products-state products-state--error">{loadError}</div>
        ) : orders.length === 0 ? (
          <Reveal delay={200} className="empty-state">
            <p>Bạn chưa có đơn hàng nào.</p>
          </Reveal>
        ) : (
          <Reveal delay={200} className="order-table">
            <div className="order-table__head">
              <span>Mã đơn</span>
              <span>Sản phẩm</span>
              <span>Ngày mua</span>
              <span>Số tiền</span>
              <span>Trạng thái</span>
              <span>Key</span>
            </div>
            {orders.map((o) => (
              <div className="order-table__row" key={o.id}>
                <span className="order-table__id">{o.id.slice(0, 8).toUpperCase()}</span>
                <span>
                  {o.product_name}
                  <span className="order-table__sub"> · {o.duration_label}</span>
                </span>
                <span>{formatDate(o.created_at)}</span>
                <span className="order-table__amount">
                  {Number(o.amount).toLocaleString("vi-VN")}₫
                </span>
                <span className={`order-status order-status--${o.status}`}>
                  {statusLabel[o.status] || o.status}
                </span>
                <OrderKeyCell value={o.license_key} />
              </div>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* --- SePay auto bank-transfer QR panel ------------------------------------------ */
const SEPAY_PENDING_SECONDS = 15 * 60; // QR / order code stays valid for 15 minutes
const SEPAY_POLL_MS = 4000;

function SePayQrPanel({ request, onConfirmed, onCancel }) {
  const [secondsLeft, setSecondsLeft] = useState(SEPAY_PENDING_SECONDS);
  const [copiedKey, setCopiedKey] = useState("");
  const [checkError, setCheckError] = useState("");

  const bankAccount = import.meta.env.VITE_SEPAY_BANK_ACCOUNT || "";
  const bankCode = import.meta.env.VITE_SEPAY_BANK_CODE || "";
  const accountName = import.meta.env.VITE_SEPAY_ACCOUNT_NAME || "";
  const configured = Boolean(bankAccount && bankCode);

  const qrUrl = configured
    ? `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankAccount)}&bank=${encodeURIComponent(
        bankCode
      )}&amount=${encodeURIComponent(request.amount)}&des=${encodeURIComponent(request.order_code)}`
    : null;

  // Countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Poll the request status until the SePay webhook marks it completed
  useEffect(() => {
    if (secondsLeft <= 0) return;
    let cancelled = false;

    const poll = setInterval(async () => {
      const { data, error } = await supabase
        .from("topup_requests")
        .select("status")
        .eq("id", request.id)
        .single();

      if (cancelled) return;

      if (error) {
        setCheckError(error.message);
        return;
      }
      if (data?.status === "completed") {
        clearInterval(poll);
        onConfirmed();
      }
    }, SEPAY_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [request.id, secondsLeft, onConfirmed]);

  function copy(text, key) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1500);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft <= 0;

  return (
    <div className="sepay-panel">
      <div className="sepay-panel__qr">
        {!configured ? (
          <div className="sepay-panel__warning">
            <AlertTriangle size={18} />
            <span>
              Chưa cấu hình tài khoản SePay. Vui lòng khai báo VITE_SEPAY_BANK_ACCOUNT và
              VITE_SEPAY_BANK_CODE trong file .env.
            </span>
          </div>
        ) : expired ? (
          <div className="sepay-panel__warning">
            <Clock3 size={18} />
            <span>Mã QR đã hết hạn. Vui lòng tạo yêu cầu nạp tiền mới.</span>
          </div>
        ) : (
          <img src={qrUrl} alt="Mã QR chuyển khoản" width={220} height={220} />
        )}
      </div>

      <div className="sepay-panel__info">
        <div className="sepay-panel__row">
          <span>Ngân hàng</span>
          <strong>{bankCode || "—"}</strong>
        </div>
        <div className="sepay-panel__row">
          <span>Số tài khoản</span>
          <strong>{bankAccount || "—"}</strong>
          {bankAccount && (
            <button type="button" className="sepay-panel__copy" onClick={() => copy(bankAccount, "acc")}>
              <Copy size={13} /> {copiedKey === "acc" ? "Đã chép" : "Chép"}
            </button>
          )}
        </div>
        <div className="sepay-panel__row">
          <span>Chủ tài khoản</span>
          <strong>{accountName || "—"}</strong>
        </div>
        <div className="sepay-panel__row">
          <span>Số tiền</span>
          <strong>{Number(request.amount).toLocaleString("vi-VN")}₫</strong>
        </div>
        <div className="sepay-panel__row sepay-panel__row--code">
          <span>Nội dung chuyển khoản</span>
          <strong>{request.order_code}</strong>
          <button
            type="button"
            className="sepay-panel__copy"
            onClick={() => copy(request.order_code, "code")}
          >
            <Copy size={13} /> {copiedKey === "code" ? "Đã chép" : "Chép"}
          </button>
        </div>

        <p className="sepay-panel__note">
          Nhập <strong>đúng nội dung</strong> chuyển khoản ở trên (giữ nguyên, không thêm bớt ký tự) để
          hệ thống tự động đối soát và cộng tiền vào ví trong vài giây sau khi giao dịch thành
          công.
        </p>

        {checkError && <div className="authmodal__error">{checkError}</div>}

        {!expired ? (
          <div className="sepay-panel__status">
            <Loader2 size={16} className="authmodal__spinner" />
            Đang chờ thanh toán… {mm}:{ss}
          </div>
        ) : null}

        <button type="button" className="btn btn--outline sepay-panel__cancel" onClick={onCancel}>
          {expired ? "Tạo yêu cầu mới" : "Huỷ / nhập lại"}
        </button>
      </div>
    </div>
  );
}

/* --- Top-up Page ---------------------------------------------------------------- */
function TopUpPage({ user, onAuthOpen, profile, onWalletChange }) {
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];
  const [amount, setAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sepayRequest, setSepayRequest] = useState(null);

  const balance = (profile?.wallet_balance ?? 0).toLocaleString("vi-VN") + "₫";

  function selectQuick(v) {
    setAmount(v);
    setCustomAmount(String(v));
  }

  function handleCustomChange(e) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setCustomAmount(digits);
    setAmount(digits ? Number(digits) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount) return;

    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.rpc("request_topup", {
      p_amount: amount,
      p_method: "sepay",
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // data is the newly created topup_requests row (id, order_code, amount, status...)
    setSepayRequest(data);
  }

  function handleSepayConfirmed() {
    setSepayRequest(null);
    setSubmitted(true);
    onWalletChange?.();
  }

  function handleSepayCancel() {
    setSepayRequest(null);
    setAmount(null);
    setCustomAmount("");
  }

  return (
    <section className="page-section">
      <div className="container">
        <Reveal className="eyebrow">
          <Wallet size={14} /> VÍ ACX
        </Reveal>
        <Reveal as="h1" delay={80} className="page-section__title">
          Nạp tiền vào tài khoản
        </Reveal>
        <Reveal delay={140} className="page-section__lede">
          Gửi yêu cầu nạp tiền, số dư sẽ được cộng vào ví sau khi giao dịch được xác nhận.
        </Reveal>

        {!user ? (
          <Reveal delay={200} className="empty-state">
            <p>Vui lòng đăng nhập để nạp tiền vào tài khoản.</p>
            <button className="btn btn--solid" onClick={() => onAuthOpen("login")}>
              Đăng nhập <ArrowRight size={16} />
            </button>
          </Reveal>
        ) : (
          <Reveal delay={200} className="topup-panel">
            <div className="topup-balance">
              <span>Số dư hiện tại</span>
              <strong>{balance}</strong>
            </div>

            {sepayRequest ? (
              <SePayQrPanel
                request={sepayRequest}
                onConfirmed={handleSepayConfirmed}
                onCancel={handleSepayCancel}
              />
            ) : submitted ? (
              <div className="topup-success">
                <Check size={22} />
                <h3>Nạp tiền thành công!</h3>
                <p>
                  {Number(amount).toLocaleString("vi-VN")}₫ đã được cộng vào ví ACX của bạn.
                </p>
                <button
                  className="btn btn--outline"
                  onClick={() => {
                    setSubmitted(false);
                    setAmount(null);
                    setCustomAmount("");
                  }}
                >
                  Nạp thêm
                </button>
              </div>
            ) : (
              <form className="topup-form" onSubmit={handleSubmit}>
                <label className="topup-form__label">Chọn nhanh số tiền</label>
                <div className="topup-quick">
                  {quickAmounts.map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={`topup-quick__btn ${amount === v ? "topup-quick__btn--active" : ""}`}
                      onClick={() => selectQuick(v)}
                    >
                      {v.toLocaleString("vi-VN")}₫
                    </button>
                  ))}
                </div>

                <label className="topup-form__label" htmlFor="topup-custom">
                  Hoặc nhập số tiền khác
                </label>
                <div className="authmodal__input topup-input">
                  <Wallet size={16} />
                  <input
                    id="topup-custom"
                    type="text"
                    inputMode="numeric"
                    placeholder="Nhập số tiền (VNĐ)"
                    value={customAmount ? Number(customAmount).toLocaleString("vi-VN") : ""}
                    onChange={handleCustomChange}
                  />
                </div>

                {errorMsg && <div className="authmodal__error">{errorMsg}</div>}

                <button
                  type="submit"
                  className="btn btn--solid topup-form__submit"
                  disabled={!amount || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="authmodal__spinner" />
                      Đang gửi yêu cầu…
                    </>
                  ) : (
                    <>
                      Tạo mã QR chuyển khoản <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* --- Footer ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <a href="#top" className="nav__logo">
            <span className="nav__logo-mark">A</span>
            <span>ACX</span>
          </a>
          <p>Cung Cấp Phần Mềm Hỗ Trợ Full Đỏ.</p>
          <div className="footer__social">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
          </div>
        </div>

        <div className="footer__col">
          <h4>Products</h4>
          	<a href="#products">ACX MODMENU</a>
 	 	<a href="#products">ACX AIMNECK</a>
          	<a href="#products">BYPASS</a>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} ACX Panel Store. All rights reserved.</span>
        <div className="footer__legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Warranty Terms</a>
        </div>
      </div>
    </footer>
  );
}

/* --- Root --------------------------------------------------------------------- */
function hashToPage(hash) {
  const h = hash.replace("#", "");
  if (h === "history") return "history";
  if (h === "topup") return "topup";
  return "home";
}

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [page, setPage] = useState(() =>
    typeof window !== "undefined" ? hashToPage(window.location.hash) : "home"
  );

  // Track the live Supabase session so the nav reflects logged-in state
  // and updates automatically after login, signup, or logout anywhere in the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) setAuthOpen(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load (and reload) the wallet/profile row whenever the logged-in user
  // changes, or whenever something elsewhere in the app touches the wallet
  // balance (a purchase or a top-up request).
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setProfile(data);
      });

    return () => { cancelled = true; };
  }, [user, walletRefreshKey]);

  function refreshWallet() {
    setWalletRefreshKey((k) => k + 1);
  }

  // Keep the page in sync with the URL hash (back/forward buttons, direct links)
  useEffect(() => {
    function onHashChange() {
      setPage(hashToPage(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Navigate to a top-level page ("home" | "history" | "topup"), optionally
  // scrolling to a section id once we land on that page (used for the
  // in-page anchors like "products" that only exist on the home page).
  function navigate(target, scrollToId) {
    setPage(target);
    window.location.hash = scrollToId || (target === "home" ? "" : target);
    if (scrollToId) {
      requestAnimationFrame(() => {
        document.getElementById(scrollToId)?.scrollIntoView({ behavior: "smooth" });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function handleLogout() {
    supabase.auth.signOut();
  }

  return (
    <div className="acx">
      <Style />
      <Nav
        onAuthOpen={openAuth}
        user={user}
        onLogout={handleLogout}
        page={page}
        onNavigate={navigate}
        profile={profile}
      />

      {page === "history" && (
        <PurchaseHistoryPage user={user} onAuthOpen={openAuth} refreshKey={walletRefreshKey} />
      )}
      {page === "topup" && (
        <TopUpPage user={user} onAuthOpen={openAuth} profile={profile} onWalletChange={refreshWallet} />
      )}
      {page === "home" && (
        <>
          <Hero />
          <Products user={user} onAuthOpen={openAuth} onWalletChange={refreshWallet} />
        </>
      )}

      <Footer />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

/* --- Styles -------------------------------------------------------------------- */
function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

      .acx {
        --bg: #0A0A0C;
        --bg-2: #131315;
        --bg-elev: #1A1A1D;
        --text: #F5F5F2;
        --muted: #9a9aa0;
        --accent: #C9A227;
        --accent-soft: #E8C468;
        --border: rgba(255,255,255,0.08);
        --radius: 14px;
        background: var(--bg);
        color: var(--text);
        font-family: 'Inter', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      .acx h1, .acx h2, .acx h3, .acx h4 {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        letter-spacing: -0.02em;
        margin: 0;
        line-height: 1.1;
      }
      .acx p { margin: 0; color: var(--muted); line-height: 1.65; }
      .acx a { color: inherit; text-decoration: none; }
      .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
      .text-accent { color: var(--accent); }

      /* Reveal */
      .reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s ease, transform .7s ease; }
      .reveal--visible { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .reveal { transition: none; opacity: 1; transform: none; }
      }

      /* Cell grid signature */
      .cellgrid { position: absolute; inset: 0; display: grid; gap: 3px; z-index: 0; opacity: .5; }
      .cellgrid__cell {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.035);
        animation: cellpulse 5.5s ease-in-out infinite;
      }
      @keyframes cellpulse {
        0%, 92%, 100% { background: rgba(255,255,255,0.025); box-shadow: none; }
        96% { background: rgba(201,162,39,0.35); box-shadow: 0 0 14px rgba(201,162,39,0.35); }
      }

      /* Buttons */
      .btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 13px 22px; border-radius: 999px; font-weight: 600; font-size: 14.5px;
        border: 1px solid transparent; cursor: pointer; white-space: nowrap;
        transition: transform .25s ease, background .25s ease, border-color .25s ease, box-shadow .25s ease;
      }
      .btn:hover { transform: translateY(-2px); }
      .btn--solid { background: var(--accent); color: #0A0A0C; }
      .btn--solid:hover { background: var(--accent-soft); box-shadow: 0 10px 30px rgba(201,162,39,0.25); }
      .btn--outline { border-color: rgba(255,255,255,0.18); color: var(--text); }
      .btn--outline:hover { border-color: var(--accent); color: var(--accent-soft); }
      .btn--ghost { color: var(--muted); }
      .btn--ghost:hover { color: var(--text); }
      .btn--lg { padding: 15px 28px; font-size: 15.5px; }
      .btn--sm { padding: 9px 16px; font-size: 13px; }
      .product-card__buy-btn {
        background: #0A0A0C; color: #fff; border: 1px solid rgba(255,255,255,0.18);
      }
      .product-card__buy-btn:hover {
        background: var(--accent); color: #0A0A0C; border-color: var(--accent);
      }

      /* Nav */
      .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background .3s ease, border-color .3s ease; border-bottom: 1px solid transparent; }
      .nav--solid { background: rgba(10,10,12,0.85); backdrop-filter: blur(14px); border-color: var(--border); }
      .nav__inner { max-width: 1180px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
      .nav__logo { display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 19px; }
      .nav__logo-mark { width: 30px; height: 30px; border-radius: 8px; background: var(--accent); color: #0A0A0C; display: grid; place-items: center; font-size: 15px; }
      .nav__links { display: none; gap: 30px; }
      .nav__link { font-size: 14px; color: var(--muted); transition: color .2s ease; }
      .nav__link:hover { color: var(--text); }
      .nav__link--active { color: var(--accent-soft); }
      .nav__cta-wrap { display: none; align-items: center; gap: 10px; }
      .nav__icon-btn {
        width: 38px; height: 38px; border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16); background: none; color: var(--text);
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; transition: border-color .2s ease, color .2s ease, transform .2s ease;
      }
      .nav__icon-btn:hover { border-color: var(--accent); color: var(--accent-soft); transform: translateY(-1px); }
      .nav__icon-btn--active {
        background: var(--accent); border-color: var(--accent); color: #0A0A0C;
        font-weight: 700; font-size: 13px;
      }
      .nav__icon-btn--active:hover { background: var(--accent-soft); color: #0A0A0C; }
      .nav__burger { background: none; border: none; color: var(--text); display: inline-flex; }
      .nav__mobile { max-height: 0; overflow: hidden; background: var(--bg-2); transition: max-height .35s ease; display: flex; flex-direction: column; }
      .nav__mobile--open { max-height: 420px; border-top: 1px solid var(--border); }
      .nav__mobile a { padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: 15px; }
      .nav__mobile .btn { margin: 16px 24px; justify-content: center; }
      .nav__mobile-auth { display: flex; gap: 10px; padding: 16px 24px 0; }
      .nav__mobile-auth .btn { margin: 0; flex: 1; }
      .nav__mobile-auth--logged-in { flex-direction: column; gap: 10px; }
      .nav__mobile-email { font-size: 13px; color: var(--muted); }

      /* Account dropdown */
      .nav__account { position: relative; }
      .account-menu {
        position: absolute; top: calc(100% + 12px); right: 0; z-index: 60;
        width: 260px; background: var(--bg-elev); border: 1px solid var(--border);
        border-radius: 16px; padding: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.45);
        animation: accountMenuIn .2s ease;
      }
      @keyframes accountMenuIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .account-menu__head { display: flex; align-items: center; gap: 12px; padding: 10px 10px 12px; }
      .account-menu__avatar {
        width: 38px; height: 38px; border-radius: 999px; background: var(--accent);
        color: #0A0A0C; font-weight: 700; font-size: 15px;
        display: grid; place-items: center; flex-shrink: 0;
      }
      .account-menu__id { display: flex; flex-direction: column; overflow: hidden; }
      .account-menu__id strong { font-size: .88rem; color: var(--text); }
      .account-menu__id span {
        font-size: .76rem; color: var(--muted); white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .account-menu__divider { height: 1px; background: var(--border); margin: 4px 0; }
      .account-menu__item {
        width: 100%; display: flex; align-items: center; gap: 10px;
        background: none; border: none; color: var(--text); font-size: .87rem;
        padding: 10px; border-radius: 10px; cursor: pointer; text-align: left;
        font-family: 'Inter', sans-serif; transition: background .2s ease;
      }
      .account-menu__item:hover { background: rgba(255,255,255,0.05); }
      .account-menu__item svg { color: var(--muted); flex-shrink: 0; }
      .account-menu__item span:first-of-type { flex: 1; }
      .account-menu__badge {
        background: rgba(201,162,39,0.15); color: var(--accent-soft);
        font-size: .74rem; font-weight: 600; padding: 2px 8px; border-radius: 999px;
      }
      .account-menu__value { font-family: 'IBM Plex Mono', monospace; font-size: .8rem; color: var(--accent-soft); }
      .account-menu__item--danger { color: #e08a8a; }
      .account-menu__item--danger svg { color: #e08a8a; }
      .account-menu__item--danger:hover { background: rgba(217,90,90,0.1); }

      .nav__mobile-account {
        margin: 16px 24px 0; padding: 6px 4px; border: 1px solid var(--border);
        border-radius: 16px; background: var(--bg-2);
      }
      .nav__mobile-account .account-menu__head { padding: 12px 10px; }
      @media (min-width: 900px) {
        .nav__links { display: flex; }
        .nav__cta-wrap { display: flex; }
        .nav__burger { display: none; }
      }

      /* Hero */
      .hero { position: relative; min-height: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 60px; }
      .hero__scrim { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 20%, rgba(201,162,39,0.10), transparent 55%), linear-gradient(180deg, var(--bg) 0%, var(--bg) 70%, var(--bg-2) 100%); z-index: 1; }
      .hero__content { position: relative; z-index: 2; max-width: 780px; display: flex; flex-direction: column; align-items: center; gap: 22px; }
      .eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; letter-spacing: 0.12em; color: var(--accent-soft); text-transform: uppercase; }
      .hero__title { font-size: clamp(2.2rem, 6vw, 4.2rem); font-weight: 700; }
      .hero__sub { font-size: clamp(1rem, 2vw, 1.15rem); max-width: 660px; display: flex; flex-direction: column; gap: 6px; }
      .hero__sub-line { display: block; color: var(--muted); line-height: 1.65; }
      .hero__actions { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
      .hero__stats { display: flex; gap: 34px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
      .hero__stats div { display: flex; flex-direction: column; align-items: center; }
      .hero__stats strong { font-family: 'IBM Plex Mono', monospace; font-size: 1.2rem; color: var(--text); }
      .hero__stats span { font-size: 12px; color: var(--muted); }
      .hero__scroll { position: absolute; bottom: 28px; z-index: 2; color: var(--muted); animation: bounce 2.2s ease-in-out infinite; }
      @keyframes bounce { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(6px);} }

      /* Sections */
      .section { padding: 110px 0; position: relative; }
      .section--muted { background: var(--bg-2); }
      .section__title { font-size: clamp(1.7rem, 3.6vw, 2.6rem); font-weight: 700; max-width: 680px; margin-top: 14px; }
      .section__lede { max-width: 560px; margin-top: 16px; font-size: 1.02rem; }

      /* About */
      .about { display: grid; gap: 60px; }
      .about__lede { margin-top: 16px; max-width: 540px; }
      .about__grid { display: grid; gap: 20px; grid-template-columns: repeat(2, 1fr); }
      .about__card { background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); padding: 26px; transition: transform .3s ease, border-color .3s ease; }
      .about__card:hover { transform: translateY(-4px); border-color: rgba(201,162,39,0.35); }
      .about__icon { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: rgba(201,162,39,0.12); color: var(--accent-soft); margin-bottom: 14px; }
      .about__card h3 { font-size: 1.02rem; margin-bottom: 8px; }
      .about__card p { font-size: 0.92rem; }
      @media (min-width: 980px) { .about { grid-template-columns: 0.9fr 1.1fr; } }

      /* Products */
      .products { margin-top: 50px; display: grid; gap: 22px; grid-template-columns: 1fr; }
      .products-state {
        margin-top: 50px; padding: 50px 30px; text-align: center;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        color: var(--muted); font-size: .92rem;
        background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius);
      }
      .products-state--error { color: #e08a8a; }
      .product-card { position: relative; background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); padding: 30px; display: flex; flex-direction: column; transition: transform .3s ease, border-color .3s ease; }
      .product-card:hover { transform: translateY(-6px); border-color: rgba(201,162,39,0.35); }
      .product-card--featured { border-color: var(--accent); background: linear-gradient(180deg, rgba(201,162,39,0.07), var(--bg-elev) 40%); }
      .product-card__badge { position: absolute; top: -12px; left: 26px; background: var(--accent); color: #0A0A0C; font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
      .product-card__tag { font-size: 12px; color: var(--accent-soft); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
      .product-card h3 { font-size: 1.4rem; margin: 10px 0 12px; }
      .product-card__desc { font-size: .93rem; margin-bottom: 18px; }
      .product-card ul { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
      .product-card li { display: flex; align-items: center; gap: 9px; font-size: .89rem; color: var(--text); }
      .product-card li svg { color: var(--accent); flex-shrink: 0; }
      .product-card__img-wrap { width: 100%; margin-bottom: 18px; border-radius: 10px; overflow: hidden; }
      .product-card__img { width: 100%; height: auto; display: block; object-fit: cover; border-radius: 10px; }
      .product-card__img-placeholder { width: 100%; height: 160px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: .85rem; }
      .product-card__foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 18px; border-top: 1px solid var(--border); }
      .product-card__foot strong { font-family: 'IBM Plex Mono', monospace; font-size: .95rem; }
      @media (min-width: 900px) { .products { grid-template-columns: repeat(3, 1fr); } }

      /* Process */
      .process { margin-top: 50px; display: grid; gap: 30px; grid-template-columns: 1fr; }
      .process__num { font-family: 'IBM Plex Mono', monospace; font-size: 2.2rem; color: var(--accent); opacity: .55; }
      .process__step h3 { font-size: 1.1rem; margin: 10px 0 8px; }
      .process__step p { font-size: .92rem; }
      @media (min-width: 900px) { .process { grid-template-columns: repeat(4, 1fr); } }

      /* Pricing */
      .pricing { margin-top: 50px; display: grid; gap: 22px; grid-template-columns: 1fr; }
      .price-card { position: relative; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px 28px; display: flex; flex-direction: column; }
      .price-card--featured { border-color: var(--accent); background: linear-gradient(180deg, rgba(201,162,39,0.08), var(--bg-2) 45%); transform: scale(1.02); }
      .price-card__badge { position: absolute; top: -13px; left: 28px; background: var(--accent); color: #0A0A0C; font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
      .price-card h3 { font-size: 1.2rem; }
      .price-card__note { font-size: .85rem; margin: 6px 0 18px; }
      .price-card__price { font-family: 'IBM Plex Mono', monospace; font-size: 1.9rem; color: var(--text); margin-bottom: 22px; }
      .price-card ul { list-style: none; padding: 0; margin: 0 0 26px; display: flex; flex-direction: column; gap: 12px; flex-grow: 1; }
      .price-card li { display: flex; align-items: center; gap: 9px; font-size: .88rem; color: var(--text); }
      .price-card li svg { color: var(--accent); flex-shrink: 0; }
      .price-card__cta { justify-content: center; }
      @media (min-width: 900px) { .pricing { grid-template-columns: repeat(3, 1fr); } }

      /* CTA band */
      .cta-band { position: relative; padding: 120px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; background: var(--bg-2); overflow: hidden; }
      .cta-band__grid { opacity: .35; }
      .cta-band__title { position: relative; z-index: 1; font-size: clamp(1.8rem, 4vw, 2.8rem); max-width: 620px; }
      .cta-band__sub { position: relative; z-index: 1; max-width: 480px; }

      /* Auth Modal */
      .authmodal-overlay {
        position: fixed; inset: 0; z-index: 200;
        background: rgba(6,6,7,0.72); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: authOverlayIn .25s ease;
      }
      @keyframes authOverlayIn { from { opacity: 0; } to { opacity: 1; } }
      .authmodal {
        position: relative; width: 100%; max-width: 420px;
        max-height: 90vh; overflow-y: auto;
        background: var(--bg-elev); border: 1px solid var(--border);
        border-radius: 20px; padding: 38px 32px 30px;
        animation: authModalIn .35s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes authModalIn {
        from { opacity: 0; transform: translateY(16px) scale(.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .authmodal__close {
        position: absolute; top: 18px; right: 18px; background: none; border: none;
        color: var(--muted); cursor: pointer; transition: color .2s ease;
      }
      .authmodal__close:hover { color: var(--text); }
      .authmodal__head { text-align: center; margin-bottom: 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .authmodal__head h3 { font-size: 1.3rem; }
      .authmodal__head p { font-size: .85rem; max-width: 300px; }
      .authmodal__tabs {
        display: flex; background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 999px; padding: 4px; margin-bottom: 26px;
      }
      .authmodal__tab {
        flex: 1; padding: 9px 0; border: none; background: none; color: var(--muted);
        font-weight: 600; font-size: .87rem; border-radius: 999px; cursor: pointer;
        transition: background .25s ease, color .25s ease; font-family: 'Inter', sans-serif;
      }
      .authmodal__tab--active { background: var(--accent); color: #0A0A0C; }
      .authmodal__form { display: flex; flex-direction: column; gap: 16px; }
      .authmodal__field { display: flex; flex-direction: column; gap: 7px; font-size: .82rem; color: var(--muted); }
      .authmodal__input {
        display: flex; align-items: center; gap: 10px; background: var(--bg-2);
        border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px;
        transition: border-color .2s ease;
      }
      .authmodal__input:focus-within { border-color: var(--accent); }
      .authmodal__input svg { color: var(--muted); flex-shrink: 0; }
      .authmodal__input input {
        flex: 1; min-width: 0; background: none; border: none; outline: none;
        color: var(--text); font-size: .92rem; font-family: 'Inter', sans-serif;
      }
      .authmodal__input input::placeholder { color: #6a6a70; }
      .authmodal__eye { background: none; border: none; color: var(--muted); cursor: pointer; display: flex; padding: 0; }
      .authmodal__eye:hover { color: var(--text); }
      .authmodal__forgot { align-self: flex-end; font-size: .8rem; color: var(--accent-soft); margin-top: -6px; }
      .authmodal__forgot:hover { text-decoration: underline; }
      .authmodal__terms { display: flex; align-items: flex-start; gap: 9px; font-size: .8rem; color: var(--muted); }
      .authmodal__terms input { margin-top: 3px; accent-color: var(--accent); }
      .authmodal__submit { justify-content: center; width: 100%; margin-top: 4px; }
      .authmodal__submit:disabled { opacity: .7; cursor: not-allowed; transform: none; }
      .authmodal__spinner { animation: authSpin .8s linear infinite; }
      @keyframes authSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .authmodal__error {
        background: rgba(217,90,90,0.1); border: 1px solid rgba(217,90,90,0.35);
        color: #e08a8a; font-size: .82rem; border-radius: 10px; padding: 10px 14px;
      }
      .authmodal__head--success p { max-width: 320px; }
      .authmodal__head--success .authmodal__submit { margin-top: 10px; }
      .authmodal__divider {
        display: flex; align-items: center; gap: 12px; margin: 22px 0 16px;
        color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .06em;
      }
      .authmodal__divider::before, .authmodal__divider::after {
        content: ""; flex: 1; height: 1px; background: var(--border);
      }
      .authmodal__switch { text-align: center; margin-top: 24px; font-size: .85rem; color: var(--muted); }
      .authmodal__switch button {
        background: none; border: none; color: var(--accent-soft); font-weight: 600;
        cursor: pointer; padding: 0; font-size: inherit; font-family: 'Inter', sans-serif;
      }
      .authmodal__switch button:hover { text-decoration: underline; }

      /* Buy Modal */
      .buymodal__field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
      .buymodal__field label { font-size: .82rem; color: var(--muted); }
      .buymodal__select {
        width: 100%; appearance: none; -webkit-appearance: none;
        background: var(--bg-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239a9aa0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 14px center;
        border: 1px solid var(--border); border-radius: 10px; padding: 12px 40px 12px 14px;
        color: var(--text); font-size: .92rem; font-family: 'Inter', sans-serif; cursor: pointer;
        transition: border-color .2s ease;
      }
      .buymodal__select:focus { outline: none; border-color: var(--accent); }
      .buymodal__total {
        display: flex; align-items: center; justify-content: space-between;
        background: var(--bg-2); border: 1px solid var(--border); border-radius: 10px;
        padding: 14px 16px; margin-bottom: 20px; font-size: .88rem; color: var(--muted);
      }
      .buymodal__total strong { font-family: 'IBM Plex Mono', monospace; font-size: 1.15rem; color: var(--accent-soft); }
      .buymodal__key {
        width: 100%; background: var(--bg-2); border: 1px solid var(--border); border-radius: 10px;
        padding: 16px 18px; margin: 6px 0 4px; text-align: left;
      }
      .buymodal__key > span:first-child { font-size: .78rem; color: var(--muted); }
      .buymodal__key-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; }
      .buymodal__key-row strong { font-family: 'IBM Plex Mono', monospace; font-size: 1rem; color: var(--accent-soft); word-break: break-all; }
      .buymodal__key-note { font-size: .78rem; color: var(--muted); margin-top: 8px; }

      /* Page section (Purchase History / Top-up) */
      .page-section { padding: 150px 0 110px; min-height: 70vh; }
      .page-section__title { font-size: clamp(1.9rem, 4vw, 2.8rem); font-weight: 700; margin-top: 14px; }
      .page-section__lede { max-width: 560px; margin-top: 14px; font-size: 1.02rem; }

      .empty-state {
        margin-top: 50px; padding: 46px 30px; text-align: center;
        background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius);
        display: flex; flex-direction: column; align-items: center; gap: 18px;
      }

      /* Order table */
      .order-table { margin-top: 40px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
      .order-table__head, .order-table__row {
        display: grid; grid-template-columns: .9fr 1.3fr .9fr .9fr .9fr 1.3fr; gap: 10px; padding: 16px 22px; align-items: center;
      }
      .order-table__head { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); border-bottom: 1px solid var(--border); }
      .order-table__row { border-bottom: 1px solid var(--border); font-size: .92rem; }
      .order-table__row:last-child { border-bottom: none; }
      .order-table__id { font-family: 'IBM Plex Mono', monospace; color: var(--muted); font-size: .85rem; }
      .order-table__amount { font-family: 'IBM Plex Mono', monospace; color: var(--text); }
      .order-table__sub { color: var(--muted); font-size: .85rem; }
      .order-status { justify-self: start; font-size: .78rem; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
      .order-status--completed { background: rgba(80,180,120,0.14); color: #7fd6a6; }
      .order-status--pending { background: rgba(201,162,39,0.14); color: var(--accent-soft); }
      .order-status--failed { background: rgba(217,90,90,0.14); color: #e08a8a; }
      .order-table__key { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .order-table__key-value { font-family: 'IBM Plex Mono', monospace; font-size: .8rem; color: var(--accent-soft); }
      @media (max-width: 760px) {
        .order-table__head { display: none; }
        .order-table__row { grid-template-columns: 1fr 1fr; row-gap: 6px; }
      }

      /* Top-up */
      .topup-panel { margin-top: 40px; max-width: 560px; }
      .topup-balance {
        display: flex; align-items: center; justify-content: space-between;
        background: linear-gradient(135deg, rgba(201,162,39,0.14), var(--bg-elev) 70%);
        border: 1px solid var(--border); border-radius: var(--radius); padding: 22px 26px; margin-bottom: 26px;
      }
      .topup-balance span { font-size: .85rem; color: var(--muted); }
      .topup-balance strong { font-family: 'IBM Plex Mono', monospace; font-size: 1.5rem; color: var(--accent-soft); }
      .topup-form { background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; display: flex; flex-direction: column; gap: 10px; }
      .topup-form__label { font-size: .82rem; color: var(--muted); margin-top: 14px; }
      .topup-form__label:first-child { margin-top: 0; }
      .topup-quick { display: flex; flex-wrap: wrap; gap: 10px; }
      .topup-quick__btn {
        padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border);
        background: var(--bg-2); color: var(--text); font-size: .87rem; cursor: pointer;
        font-family: 'IBM Plex Mono', monospace; transition: border-color .2s ease, color .2s ease;
      }
      .topup-quick__btn:hover { border-color: var(--accent); color: var(--accent-soft); }
      .topup-quick__btn--active { border-color: var(--accent); background: rgba(201,162,39,0.12); color: var(--accent-soft); }
      .topup-input { margin-top: 2px; }
      .topup-methods { display: flex; flex-direction: column; gap: 10px; }
      .topup-methods__btn {
        text-align: left; padding: 13px 16px; border-radius: 10px; border: 1px solid var(--border);
        background: var(--bg-2); color: var(--text); font-size: .9rem; cursor: pointer;
        font-family: 'Inter', sans-serif; transition: border-color .2s ease, color .2s ease;
      }
      .topup-methods__btn:hover { border-color: var(--accent); }
      .topup-methods__btn--active { border-color: var(--accent); background: rgba(201,162,39,0.1); color: var(--accent-soft); }
      .topup-form__submit { justify-content: center; margin-top: 20px; }
      .topup-form__submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }
      .topup-success {
        background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius);
        padding: 40px 30px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
      }
      .topup-success svg { color: var(--accent); background: rgba(201,162,39,0.14); border-radius: 999px; padding: 10px; width: 42px; height: 42px; box-sizing: content-box; }
      .topup-success p { max-width: 380px; }

      /* SePay QR panel */
      .sepay-panel {
        background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius);
        padding: 28px; display: flex; flex-direction: column; gap: 22px;
      }
      @media (min-width: 640px) {
        .sepay-panel { flex-direction: row; align-items: flex-start; }
      }
      .sepay-panel__qr {
        flex: 0 0 220px; width: 220px; height: 220px; border-radius: 12px; overflow: hidden;
        background: #fff; display: grid; place-items: center;
      }
      .sepay-panel__qr img { width: 100%; height: 100%; object-fit: contain; }
      .sepay-panel__warning {
        display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
        padding: 16px; color: var(--muted); font-size: .82rem;
      }
      .sepay-panel__warning svg { color: var(--accent-soft); }
      .sepay-panel__info { flex: 1; display: flex; flex-direction: column; gap: 10px; }
      .sepay-panel__row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        font-size: .88rem; color: var(--muted); padding: 8px 0; border-bottom: 1px solid var(--border);
      }
      .sepay-panel__row strong { color: var(--text); font-family: 'IBM Plex Mono', monospace; font-size: .92rem; }
      .sepay-panel__row--code strong { color: var(--accent-soft); }
      .sepay-panel__copy {
        display: flex; align-items: center; gap: 4px; background: none; border: none;
        color: var(--accent-soft); font-size: .78rem; cursor: pointer; padding: 4px 6px;
      }
      .sepay-panel__copy:hover { color: var(--accent); }
      .sepay-panel__note { font-size: .8rem; color: var(--muted); line-height: 1.5; }
      .sepay-panel__status {
        display: flex; align-items: center; gap: 8px; font-size: .85rem; color: var(--accent-soft);
        font-family: 'IBM Plex Mono', monospace;
      }
      .sepay-panel__cancel { justify-content: center; margin-top: 6px; }

      /* Footer */
      .footer { background: var(--bg); border-top: 1px solid var(--border); padding-top: 70px; }
      .footer__grid { display: grid; gap: 40px; grid-template-columns: 1fr; padding-bottom: 50px; }
      .footer__brand p { margin: 14px 0 18px; font-size: .9rem; max-width: 260px; }
      .footer__social { display: flex; gap: 14px; }
      .footer__social a { width: 36px; height: 36px; border-radius: 999px; border: 1px solid var(--border); display: grid; place-items: center; transition: border-color .2s ease, color .2s ease; }
      .footer__social a:hover { border-color: var(--accent); color: var(--accent-soft); }
      .footer__col { display: flex; flex-direction: column; gap: 12px; }
      .footer__col h4 { font-size: .85rem; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 4px; }
      .footer__col a, .footer__addr { font-size: .92rem; color: var(--muted); display: flex; align-items: center; gap: 8px; transition: color .2s ease; }
      .footer__col a:hover { color: var(--text); }
      .footer__bottom { display: flex; flex-direction: column; gap: 12px; padding: 24px 0; border-top: 1px solid var(--border); font-size: .82rem; color: var(--muted); }
      .footer__legal { display: flex; gap: 20px; }
      @media (min-width: 760px) {
        .footer__grid { grid-template-columns: 1.4fr 1fr 1fr 1fr; }
        .footer__bottom { flex-direction: row; justify-content: space-between; }
      }
    `}</style>
  );
}