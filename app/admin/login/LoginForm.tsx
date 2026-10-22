'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-5 space-y-3">
      <label htmlFor="token" className="sr-only">Token</label>
      <input id="token" name="token" type="password" autoComplete="current-password" className="input" placeholder="ADMIN_TOKEN" required />
      {state?.error && <p role="alert" className="text-[14px] text-brick">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Ověřuji…' : 'Přihlásit'}</button>
    </form>
  );
}
