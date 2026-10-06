import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, ownerAuthorized, safeReturnTo } from '@/lib/auth-core';
import { LoginForm } from '@/components/public/LoginForm';
export const metadata: Metadata = { title: 'Войти', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; loggedOut?: string }> }) {
 const params = await searchParams, returnTo = safeReturnTo(params.returnTo);
 if (ownerAuthorized(await headers())) redirect(returnTo);
 return <section className="site-login"><div className="site-login-intro"><p className="site-eyebrow">Вернуться к своему дню</p><h1>Твоё пространство.<br/><span>Твой темп.</span></h1><p className="site-lead">Протоколы, мысли и ближайшие планы — по ту сторону одного входа.</p><div className="site-login-note"><span aria-hidden="true">↳</span><p>Здесь не нужно начинать всё заново.<br/>Продолжи с того места, где остановился.</p></div></div><div className="site-login-card"><p className="site-eyebrow">Закрытое рабочее пространство</p><h2>С возвращением</h2>{params.loggedOut === '1' && <p className="site-success" role="status">Ты вышел из этого браузера.</p>}<LoginForm returnTo={returnTo} configured={authConfigured()}/></div></section>;
}
