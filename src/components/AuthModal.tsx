import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { findCustomerByEmail, registerCustomerInSupabase } from '../lib/db';

export const AuthModal: React.FC = () => {
  const {
    isAuthOpen,
    closeAuthModal,
    authNotice,
    setCustomerSession,
    showToast,
    openCheckout,
    cartCount
  } = useStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  if (!isAuthOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPassword) return;

    setLoginLoading(true);

    // Strict validation: Only registered emails can be logged in!
    const existingCustomer = await findCustomerByEmail(email);
    setLoginLoading(false);

    if (!existingCustomer) {
      setLoginError(
        `This email (${email}) is not registered. Only registered customers can sign in. Please click "CREATE ACCOUNT" below to register first.`
      );
      return;
    }

    // Customer verified in Supabase!
    const session = {
      name: existingCustomer.name || email.split('@')[0],
      email: existingCustomer.email,
      phone: existingCustomer.phone || '',
      address: existingCustomer.address || '',
      city: existingCustomer.city || '',
      state: existingCustomer.state || '',
      pincode: existingCustomer.pincode || '',
      joinedDate: existingCustomer.created_at
        ? new Date(existingCustomer.created_at).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB')
    };

    setCustomerSession(session);
    showToast(`Welcome back, ${session.name} ♡`);
    closeAuthModal();

    // If customer was trying to checkout, resume checkout flow!
    if (cartCount > 0) {
      openCheckout();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match. Please re-enter.');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.');
      return;
    }

    const email = registerEmail.trim().toLowerCase();
    setRegisterLoading(true);

    const result = await registerCustomerInSupabase({
      name: registerName.trim(),
      email,
      phone: registerPhone.trim()
    });

    setRegisterLoading(false);

    if (!result.success || !result.customer) {
      setRegisterError(result.error || 'Could not register account. Please try again.');
      return;
    }

    const session = {
      name: result.customer.name,
      email: result.customer.email,
      phone: result.customer.phone || '',
      address: result.customer.address || '',
      city: result.customer.city || '',
      state: result.customer.state || '',
      pincode: result.customer.pincode || '',
      joinedDate: new Date().toLocaleDateString('en-GB')
    };

    setCustomerSession(session);
    showToast(`Account created successfully! Welcome to Dear Draupadi, ${session.name} ❀`);
    closeAuthModal();

    // If customer has items in cart, proceed to checkout immediately!
    if (cartCount > 0) {
      openCheckout();
    }
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) closeAuthModal(); }}>
      <div className="modal-content" style={{ maxWidth: '440px', padding: '40px 32px' }}>
        <button className="modal-close" onClick={closeAuthModal}>×</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', color: 'var(--terracotta)', marginBottom: '8px' }}>❀</div>
          <h2 style={{ fontSize: '26px', color: 'var(--brown)', fontWeight: 400 }}>Dear Draupadi</h2>
          <p style={{ color: 'var(--soft-brown)', fontSize: '13px' }}>Little treasures, chosen with love ♡</p>
        </div>

        {authNotice && (
          <div style={{
            background: 'rgba(185, 111, 95, 0.12)',
            border: '1px solid var(--terracotta)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '12px',
            color: 'var(--brown)',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            🔒 <strong>Authentication Required:</strong>
            <div style={{ marginTop: '4px' }}>{authNotice}</div>
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <button
            onClick={() => { setTab('login'); setLoginError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '2px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: tab === 'login' ? 'var(--teal)' : 'var(--soft-brown)',
              borderBottom: tab === 'login' ? '2px solid var(--teal)' : 'none'
            }}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setTab('register'); setRegisterError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '2px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: tab === 'register' ? 'var(--teal)' : 'var(--soft-brown)',
              borderBottom: tab === 'register' ? '2px solid var(--teal)' : 'none'
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* 1. SIGN IN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{
                background: 'rgba(185, 40, 40, 0.1)',
                border: '1px solid #B92828',
                color: '#8A1515',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.5
              }}>
                {loginError}
              </div>
            )}

            <div className="form-group">
              <label>Registered Email Address *</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginError(null); }}
                required
                autoComplete="email"
              />
              <span style={{ fontSize: '11px', color: 'var(--soft-brown)', marginTop: '4px', display: 'block' }}>
                Only registered customer emails can sign in.
              </span>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              disabled={loginLoading}
            >
              {loginLoading ? 'VERIFYING IN SUPABASE...' : 'SIGN IN TO CONTINUE →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: 'var(--soft-brown)' }}>
              New to Dear Draupadi?{' '}
              <button
                type="button"
                onClick={() => { setTab('register'); setRegisterError(null); }}
                style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Create your account
              </button>
            </div>
          </form>
        ) : (
          /* 2. REGISTER FORM */
          <form onSubmit={handleRegister}>
            {registerError && (
              <div style={{
                background: 'rgba(185, 40, 40, 0.1)',
                border: '1px solid #B92828',
                color: '#8A1515',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.5
              }}>
                {registerError}
              </div>
            )}

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={registerEmail}
                onChange={e => { setRegisterEmail(e.target.value); setRegisterError(null); }}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={registerPhone}
                onChange={e => setRegisterPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label>Create Password *</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={registerConfirmPassword}
                onChange={e => setRegisterConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              disabled={registerLoading}
            >
              {registerLoading ? 'CREATING SUPABASE ACCOUNT...' : 'CREATE ACCOUNT & PROCEED ❀'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: 'var(--soft-brown)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('login'); setLoginError(null); }}
                style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
