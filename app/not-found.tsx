import Link from "next/link";

export default function NotFound() {
  return <div className="container"><div className="panel"><span className="eyebrow">404</span><h1>페이지를 찾을 수 없습니다.</h1><Link className="button" href="/">홈으로</Link></div></div>;
}
