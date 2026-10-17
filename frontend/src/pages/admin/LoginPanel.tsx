import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { FormField } from '../../components/form/FormField';

export const LoginPanel: React.FC = () => {
  const { login } = useAdminAuth();
  const { t } = useI18n();
  const copy = t.admin.login;
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<'invalid' | 'unreachable' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      const ok = await login(passphrase.trim());
      if (!ok) setError('invalid');
    } catch {
      setError('unreachable');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="admin-panel admin-login">
      <h2 className="admin-panel-title">{copy.title}</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <p className="admin-hint">{copy.hint}</p>
        <FormField label={copy.passphrase}>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
        </FormField>
        {error && <p className="form-error">{copy[error]}</p>}
        <div className="dialog-actions">
          <button type="submit" className="btn-primary-mustard" disabled={isVerifying}>
            {isVerifying ? copy.verifying : copy.submit}
          </button>
        </div>
      </form>
    </div>
  );
};
