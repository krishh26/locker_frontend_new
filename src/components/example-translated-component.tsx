/**
 * Example component showing how to use translations
 * This is a reference component - you can delete it after understanding the pattern
 */

'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';

export function ExampleTranslatedComponent() {
  // Use translations with namespace
  const t = useTranslations('common');
  const nav = useTranslations('navigation');
  const auth = useTranslations('auth');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('welcome')}</h1>
        <LanguageSwitcher />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{nav('dashboard')}</h2>
        <p>{t('loading')}</p>
      </div>

      <div className="flex gap-2">
        <Button>{t('save')}</Button>
        <Button variant="outline">{t('cancel')}</Button>
        <Button variant="destructive">{t('delete')}</Button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">{auth('signInToAccount')}</h3>
        <p>{auth('email')}: example@email.com</p>
      </div>
    </div>
  );
}
