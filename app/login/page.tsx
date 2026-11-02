import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/app/actions";
import { shoppingReturnPath } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; product?: string; destination?: string }> }) {
  const { message, product, destination } = await searchParams;
  const returnPath = shoppingReturnPath(product, destination);
  const session = await auth();
  if (session?.user) redirect(returnPath);
  const signup = returnPath.startsWith("/products/") ? "/register?product=" + product : "/register";

  return (
    <div className="container">
      <section className="panel auth-card">
        <h1>로그인</h1>
        <p className="muted">로그인해 장바구니와 주문 내역을 확인하세요.</p>
        {typeof message === "string" && <p className="notice" role="alert">{message}</p>}
        <form className="form-grid" action={loginAction}>
          {returnPath.startsWith("/products/") && <input type="hidden" name="product" value={product} />}
          {(returnPath === "/cart" || returnPath === "/orders") && <input type="hidden" name="destination" value={destination} />}
          <label>이메일<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="current-password" maxLength={72} required /></label>
          <button className="button" type="submit">로그인</button>
        </form>
        <p className="muted">아직 계정이 없나요? <Link className="text-link" href={signup}>회원가입</Link></p>
      </section>
    </div>
  );
}
