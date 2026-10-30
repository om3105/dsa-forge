import { useEffect, useState } from 'react';
import type { CourseId, Settings } from '../types';

export function applyTheme(theme: Settings['theme'], course?: CourseId) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (course) root.setAttribute('data-course', course);
  window.dispatchEvent(new Event('forge-theme'));
}

const resolve = (): 'light' | 'dark' => {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function useEffectiveTheme(): 'light' | 'dark' {
  const [t, setT] = useState(resolve);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setT(resolve());
    mq.addEventListener('change', on);
    window.addEventListener('forge-theme', on);
    return () => { mq.removeEventListener('change', on); window.removeEventListener('forge-theme', on); };
  }, []);
  return t;
}
