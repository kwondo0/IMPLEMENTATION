import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/app/actions";
import { shoppingReturnPath } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ message?: string; product?: string }> }) {
  const { message, product } = await searchParams;
  const returnPath = shoppingReturnPath(product);
  const session = await auth();
  if (session?.user) redirect(returnPath);

  return (
    <div className="container">
      <section className="panel auth-card">
        <h1>회원가입</h1>
        <p className="muted">계정을 만들고 장바구니와 주문 내역을 관리하세요.</p>
        {typeof message === "string" && <p className="notice" role="alert">{message}</p>}
        <form className="form-grid" action={registerAction}>
          {returnPath.startsWith("/products/") && <input type="hidden" name="product" value={product} />}
          <label>이름<input name="name" autoComplete="name" minLength={2} maxLength={60} required /></label>
          <label>이메일<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
          <button className="button" type="submit">계정 만들기</button>
        </form>
        <p className="muted">이미 가입했나요? <Link className="text-link" href={returnPath.startsWith("/products/") ? "/login?product=" + product : "/login"}>로그인</Link></p>
      </section>
    </div>
  );
}
