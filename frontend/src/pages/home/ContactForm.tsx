import React, { useState } from 'react';
import { FormField } from '../../components/form/FormField';
import { api, ApiError } from '../../lib/api';
import { track } from '../../lib/analytics';
import { useI18n } from '../../i18n/LanguageContext';

type Status = 'idle' | 'sending' | 'sent' | 'error';
type FormError = { kind: 'fallback' | 'tooMany' | 'server'; text?: string };

export const ContactForm: React.FC<{ email: string }> = ({ email }) => {
  const { t } = useI18n();
  const f = t.footer.form;
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<FormError>();
  const [values, setValues] = useState({ name: '', email: '', message: '', website: '' });

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(undefined);
    try {
      await api.sendContact(values);
      setStatus('sent');
      track('contact', 'sent');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError({ kind: 'tooMany' });
      else if (err instanceof ApiError && err.status === 400) {
        setError({ kind: 'server', text: err.message });
      } else setError({ kind: 'fallback' });
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="foot-form" role="status">
        <p className="foot-label">{f.sentTitle}</p>
        <p>{f.sentBody}</p>
      </div>
    );
  }

  return (
    <form className="foot-form" onSubmit={submit}>
      <FormField label={f.name}>
        <input
          type="text"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          value={values.name}
          onChange={set('name')}
        />
      </FormField>
      <FormField label={f.email}>
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
        />
      </FormField>
      <FormField label={f.message}>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={values.message}
          onChange={set('message')}
        />
      </FormField>
      <input
        type="text"
        name="website"
        className="foot-form-hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.website}
        onChange={set('website')}
      />
      {status === 'error' && error && (
        <p className="form-error" role="alert">
          {error.kind === 'tooMany' && f.tooMany}
          {error.kind === 'server' && error.text}
          {error.kind === 'fallback' && (
            <>
              {f.failed} <a href={`mailto:${email}`}>{email}</a>
            </>
          )}
        </p>
      )}
      <button type="submit" className="foot-form-send" disabled={status === 'sending'}>
        {status === 'sending' ? f.sending : f.send}
      </button>
    </form>
  );
};
