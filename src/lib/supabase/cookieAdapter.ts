import { cookies } from 'next/headers'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'; // Import for type safety

interface CookieOptions {
  maxAge?: number;
  domain?: string;
  path?: string;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
  // `name` and `value` will be passed as direct arguments, so not needed in options here.
}

export function nextCookies() {
  const store = cookies()
  return {
    get: (key: string): string | undefined => {
      const cookie = store.get(key) as RequestCookie | undefined; // Cast for type safety
      return cookie?.value;
    },
    set: (key: string, value: string, options: CookieOptions): void => {
      store.set(key, value, options); // next/headers store.set takes (name, value, options)
    },
    remove: (key: string, options: CookieOptions): void => {
      // To remove a cookie, set its value to empty and maxAge to 0 or a negative number.
      // The original suggestion was maxAge: -1, which is fine.
      store.set(key, '', { ...options, maxAge: -1 });
    }
  }
} 