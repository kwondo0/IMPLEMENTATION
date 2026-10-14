import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/products");
  const { message } = await searchParams;

  return (
    <div className="container">
      <section className="panel auth-card">
        <span className="eyebrow">Welcome back</span><h1>로그인</h1>
        <p className="muted">계정에 로그인해 주문과 장바구니를 확인하세요.</p>
        {message && <p className="notice" role="alert">{message}</p>}
        <form className="form-grid" action={loginAction}>
          <label>이메일<input name="email" type="email" autoComplete="email" required /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button" type="submit">로그인</button>
        </form>
        <p className="muted">아직 계정이 없나요? <Link href="/register">회원가입</Link></p>
      </section>
    </div>
  );
}
