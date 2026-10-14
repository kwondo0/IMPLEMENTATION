"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container">
      <div className="panel">
        <span className="eyebrow">요청을 처리하지 못했습니다</span>
        <h1>잠시 후 다시 시도해 주세요.</h1>
        <p className="muted">입력한 내용이나 로그인 상태를 확인해 주세요. 내부 오류 정보는 표시하지 않습니다.</p>
        <button className="button" onClick={() => reset()}>다시 시도</button>
      </div>
    </div>
  );
}
