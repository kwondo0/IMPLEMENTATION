"use client";

import Form from "next/form";
import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { StoreIcon } from "@/app/storefront";

const suggestions = ["키보드", "램프", "머그", "노트"];

export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);

  function openSearch(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.current?.showModal) return;
    event.preventDefault();
    dialog.current.showModal();
    search.current?.focus();
  }

  return (
    <>
      <Link className="search-trigger" href="/products#shop-search" aria-label="상품 검색" aria-haspopup="dialog" onClick={openSearch}>
        <StoreIcon name="search" /><span>검색</span>
      </Link>
      <dialog ref={dialog} className="search-dialog" aria-labelledby="search-title">
        <div className="search-dialog-heading">
          <h2 id="search-title">상품 검색</h2>
          <form method="dialog"><button className="dialog-close" type="submit" aria-label="검색 닫기">×</button></form>
        </div>
        <Form className="dialog-search-form" action="/products" onSubmit={() => dialog.current?.close()}>
          <input ref={search} type="search" name="q" aria-label="검색어" placeholder="어떤 상품을 찾으세요?" maxLength={80} enterKeyHint="search" />
          <button className="button" type="submit">검색</button>
        </Form>
        <p className="suggestions-label">추천 검색어</p>
        <ul className="search-suggestions">
          {suggestions.map((query) => <li key={query}><Link href={{ pathname: "/products", query: { q: query } }} onNavigate={() => dialog.current?.close()}>{query}</Link></li>)}
        </ul>
      </dialog>
    </>
  );
}
