import { useEffect, useState } from 'react';
import type { Lang } from '../../data/content';

export interface HanoiTime {
  /** Display string, e.g. "21:07". */
  label: string;
  /** Machine-readable value for <time dateTime>, e.g. "21:07+07:00". */
  dateTime: string;
}

export function formatHanoiTime(date: Date, lang: Lang): HanoiTime {
  const parts = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return { label: `${hour}:${minute}`, dateTime: `${hour}:${minute}+07:00` };
}

/** Current time in Hà Nội, re-rendered at the top of every minute. */
export function useHanoiTime(lang: Lang): HanoiTime {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval = 0;
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000) + 50);
    // Timers drift or stall while a tab sleeps; resync when it comes back.
    const onVisible = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return formatHanoiTime(now, lang);
}
