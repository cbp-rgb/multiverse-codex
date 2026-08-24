import { useEffect, useState } from 'react';
import { supabase, AUTH_EMAIL } from '../utils/supabaseClient.js';

// Gates the whole app behind one password field. Under the hood it's a real
// Supabase Auth sign-in against a single fixed account (AUTH_EMAIL) — that
// gives real, RLS-enforced protection for campaign secrets instead of a
// client-side check that anyone could bypass by reading the bundle — but the
// user only ever sees a password box, never an email field.
export default function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: AUTH_EMAIL, password });
    setSubmitting(false);
    if (signInError) {
      setError('Wrong password.');
      return;
    }
    setPassword('');
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-parchment text-ink font-body flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="font-deco text-3xl text-maroon-dark mb-4">Not Configured</div>
          <p className="text-[15px] leading-relaxed">
            This app needs Supabase credentials to run. Copy <code>.env.example</code> to <code>.env</code> and fill in
            <code> VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>, and <code>VITE_AUTH_EMAIL</code>.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return <div className="min-h-screen bg-parchment" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-parchment text-ink font-body flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white/40 border border-ink/15 rounded-sm p-8 text-center">
          <div className="font-deco text-3xl text-maroon-dark mb-1">The Multiverse Codex</div>
          <div className="text-[11px] font-display uppercase tracking-widest text-ink/50 mb-8">A Chronicle Beyond Worlds</div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full text-center bg-transparent border-0 border-b border-dashed border-ink/30 focus:border-maroon/60 outline-none py-2 mb-4 placeholder:text-ink/30 placeholder:italic"
          />
          {error && <div className="text-[12px] text-maroon-dark mb-4">{error}</div>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="font-display text-[12px] uppercase tracking-wide px-6 py-2 border border-maroon/40 rounded-sm text-maroon-dark disabled:opacity-40 hover:bg-maroon/5"
          >
            {submitting ? 'Entering…' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  return children;
}
