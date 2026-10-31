import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
// The public demo is browser-local. Protected API routes enforce their own identity.
export default function Page(){redirect('/legacy/index.html');}
