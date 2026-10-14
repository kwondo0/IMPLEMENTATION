import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/products");
  const { message } = await searchParams;

  return (
    <div className="container">
      <section className="panel auth-card">
        <span className="eyebrow">Create account</span><h1>회원가입</h1>
        <p className="muted">가입 계정은 기본적으로 일반 회원으로 생성됩니다.</p>
        {message && <p className="notice" role="alert">{message}</p>}
        <form className="form-grid" action={registerAction}>
          <label>이름<input name="name" autoComplete="name" minLength={2} maxLength={60} required /></label>
          <label>이메일<input name="email" type="email" autoComplete="email" required /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
          <button className="button" type="submit">계정 만들기</button>
        </form>
        <p className="muted">이미 가입했나요? <Link href="/login">로그인</Link></p>
      </section>
    </div>
  );
}
