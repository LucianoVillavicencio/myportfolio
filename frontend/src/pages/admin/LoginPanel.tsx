import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { FormField } from '../../components/form/FormField';

export const LoginPanel: React.FC = () => {
  const { login } = useAdminAuth();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    try {
      const ok = await login(passphrase.trim());
      if (!ok) setError('Invalid passphrase.');
    } catch {
      setError('Could not reach the API to verify the passphrase.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="admin-panel admin-login">
      <h2 className="admin-panel-title">OWNER ACCESS</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <p className="admin-hint">
          Enter your admin passphrase to manage books, projects and profile info.
        </p>
        <FormField label="Admin passphrase">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
        </FormField>
        {error && <p className="form-error">{error}</p>}
        <div className="dialog-actions">
          <button type="submit" className="btn-primary-mustard" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Unlock owner panel →'}
          </button>
        </div>
      </form>
    </div>
  );
};
