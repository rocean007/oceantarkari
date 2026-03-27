import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './AuthModal.module.css';

// Eye icons for password toggle
const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function AuthModal() {
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState('login'); // 'login' | 'register'
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [errors, setErrors]       = useState({});
  const [form, setForm]           = useState({ name: '', email: '', password: '' });
  const modalRef = useRef(null);
  const firstFocus = useRef(null);
  const { login, register }       = useAuth();
  const toast                     = useToast();

  useEffect(() => {
    const handler = () => { setOpen(true); setTab('login'); setErrors({}); setForm({ name:'',email:'',password:'' }); };
    window.addEventListener('vg:open-auth', handler);
    return () => window.removeEventListener('vg:open-auth', handler);
  }, []);

  // Focus trap
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocus.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setErrors({});
    setForm({ name:'', email:'', password:'' });
    setLoading(false);
  }, []);

  const validate = () => {
    const err = {};
    if (tab === 'register' && !form.name.trim()) err.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) err.email = 'Enter a valid email';
    if (form.password.length < 8) err.password = 'Password must be at least 8 characters';
    if (tab === 'register' && !/[A-Z]/.test(form.password)) err.password = 'Must contain an uppercase letter';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Focus first error field (WCAG)
      const first = modalRef.current?.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        toast.success('Account created! Welcome to Veggio.');
      }
      close();
    } catch (err) {
      const msg = err?.response?.data?.message || (tab === 'login' ? 'Invalid email or password' : 'Registration failed');
      setErrors({ submit: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => { const ne = {...er}; delete ne[e.target.name]; return ne; });
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'login' ? 'Sign in to Veggio' : 'Create Veggio account'}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={styles.modal} ref={modalRef}>
        {/* Decorative top strip */}
        <div className={styles.topStrip} aria-hidden="true">
          <span>🥦</span><span>🥕</span><span>🍅</span><span>🥒</span><span>🧅</span>
        </div>

        {/* Close */}
        <button className={styles.closeBtn} onClick={close} aria-label="Close sign in dialog">
          <CloseIcon />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {tab === 'login' ? 'Welcome back' : 'Join Veggio'}
          </h2>
          <p className={styles.subtitle}>
            {tab === 'login'
              ? 'Sign in to manage your orders and cart.'
              : 'Create your account to start ordering fresh vegetables.'}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'login'}
            className={tab === 'login' ? styles.tabActive : styles.tab}
            onClick={() => { setTab('login'); setErrors({}); }}
          >Sign In</button>
          <button
            role="tab"
            aria-selected={tab === 'register'}
            className={tab === 'register' ? styles.tabActive : styles.tab}
            onClick={() => { setTab('register'); setErrors({}); }}
          >Register</button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Global error */}
          {errors.submit && (
            <div className={styles.globalError} role="alert">
              <span aria-hidden="true">⚠</span> {errors.submit}
            </div>
          )}

          {tab === 'register' && (
            <div className={styles.field}>
              <label htmlFor="auth-name" className={styles.label}>Full Name <span aria-label="required">*</span></label>
              <input
                id="auth-name"
                ref={firstFocus}
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'auth-name-err' : undefined}
                required
              />
              {errors.name && <span id="auth-name-err" className={styles.errMsg} role="alert">{errors.name}</span>}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="auth-email" className={styles.label}>Email <span aria-label="required">*</span></label>
            <input
              id="auth-email"
              ref={tab === 'login' ? firstFocus : undefined}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'auth-email-err' : undefined}
              required
            />
            {errors.email && <span id="auth-email-err" className={styles.errMsg} role="alert">{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="auth-pass" className={styles.label}>Password <span aria-label="required">*</span></label>
            {tab === 'register' && <span className={styles.helper}>Min 8 chars, one uppercase letter</span>}
            <div className={styles.passWrap}>
              <input
                id="auth-pass"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className={`${styles.input} ${styles.passInput} ${errors.password ? styles.inputError : ''}`}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'auth-pass-err' : undefined}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            {errors.password && <span id="auth-pass-err" className={styles.errMsg} role="alert">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            aria-busy={loading}
          >
            {loading
              ? <span className={styles.spinner} aria-label="Loading" />
              : tab === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        <p className={styles.switchText}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className={styles.switchBtn}
            onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setErrors({}); }}
          >
            {tab === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
