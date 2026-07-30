import { redirect } from 'next/navigation'

/**
 * `/login` is the address staff type from memory; the actual form lives at
 * `/admin/login` alongside the rest of the console. Redirecting keeps one login
 * surface — two would mean two rate limiters and two places to get wrong.
 */
export default function Page() {
  redirect('/admin/login')
}
