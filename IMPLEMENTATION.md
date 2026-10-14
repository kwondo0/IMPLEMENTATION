# SecureCommerce 구현 가이드 (간소화 버전)

> 팀 멋사CP · 웹서버보안프로그래밍 PBL 팀프로젝트
> 기준: **수업에서 배운 코드 패턴만으로** 만들 수 있는 범위

수업 스택(Next.js 16 + MongoDB + Auth.js) 그대로 갑니다. 새로 배워야 하는 도구(Redis, Docker, JMeter, 실제 PG 연동)는 빼고, **"동시에 눌러도 재고·쿠폰이 안 꼬인다"** 와 **"서버가 금액·권한을 검증한다"** 두 가지만 확실히 보여주는 게 목표입니다.

---

## 1. 무엇을 만들고, 무엇을 뺐나

| 구분 | 만든다 ✅ | 뺀다 / 나중에 ❌ |
|---|---|---|
| 상품 | 목록, 상세, 관리자 상품 등록 | 카테고리, 검색, 이미지 업로드 |
| 장바구니 | 담기, 수량 변경, 삭제 | |
| 주문 | 주문 생성, 내 주문 목록, 취소 | 부분 취소, 환불 |
| 결제 | **가짜 결제 버튼** (서버에서 금액 검증) | 실제 PG(토스 등) 연동 |
| 재고 | **잘못된 방식 vs 올바른 방식 2개 비교** | 락 4종 비교, Redis 락 |
| 쿠폰 | 정액 할인 쿠폰 1종, 중복 사용 차단 | 정률 쿠폰, 포인트 |
| 상태 | 5개 상태 + 허용된 전이만 | 구매확정, 반품 |
| 자동 취소 | 결제할 때 15분 지났으면 거부 | 크론/스케줄러 |
| 보안 | 인증, 인가(IDOR), 금액 재계산, NoSQL Injection, 보안 헤더, 에러 숨김 | Rate Limit(시간 남으면) |
| 테스트 | 간단한 Node 스크립트로 동시 요청 100건 | JMeter, Docker |

---

## 2. 기술 스택

수업 그대로입니다: **Next.js 16 · TypeScript · Tailwind + shadcn/ui · MongoDB Atlas + Mongoose · Auth.js v5 + bcrypt · Vercel**

새로 설치할 것: 없음 (수업 프로젝트에 있는 것만 사용)

---

## 3. 폴더 구조

수업 5~7주차 구조(`lib/` 함수 ↔ `app/` 화면)를 그대로 따라갑니다.

```
app/
  products/page.tsx, [id]/page.tsx     # 상품 목록/상세
  cart/page.tsx                        # 장바구니
  orders/page.tsx, [id]/page.tsx       # 내 주문 목록/상세 (결제·취소 버튼)
  admin/page.tsx                       # 관리자: 상품 등록, 배송 상태 변경
  login/, register/                    # 7주차 그대로
  api/auth/[...nextauth]/route.ts      # 7주차 그대로
  api/test/order/route.ts              # 동시성 테스트용 (§9)
  error.tsx                            # 6주차 그대로
auth.ts                                # 7주차 + role 추가
lib/
  mongodb.ts                           # 6주차 그대로
  authz.ts                             # 로그인/관리자 확인 함수
  products.ts  cart.ts  orders.ts  coupons.ts
  actions.ts                           # "use server" 액션 모음
models/
  User.ts  Product.ts  Cart.ts  Coupon.ts  Order.ts
scripts/
  race-test.mjs                        # 동시 요청 테스트
```

---

## 4. 데이터 모델 (컬렉션 5개)

| 컬렉션 | 필드 | 메모 |
|---|---|---|
| `users` | name, email, passwordHash, **role** (`user`/`admin`) | 7주차 User에 role만 추가 |
| `products` | name, price, **stock** | |
| `carts` | userId, items: [{ productId, qty }] | 유저당 1개 |
| `coupons` | userId, code, discount(원), **used**(true/false) | 쿠폰 = 유저에게 발급된 1장 |
| `orders` | userId, items: [{ productId, name, price, qty }], couponId, totalAmount, **status**, createdAt | items에 주문 당시 가격을 복사해 둠 |

```ts
// models/Product.ts
const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
}, { timestamps: true });
export const Product = models.Product || model("Product", productSchema);
```

```ts
// models/Order.ts
const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ productId: Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
  couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "SHIPPING", "DELIVERED", "CANCELLED"],
    default: "PENDING",
  },
}, { timestamps: true });
export const Order = models.Order || model("Order", orderSchema);
```

---

## 5. 핵심 ① 재고 차감 — 딱 2가지만 비교

### ❌ 잘못된 방식 (읽고 → 계산하고 → 저장)
```ts
export async function decreaseStockBad(productId: string, qty: number) {
  const p = await Product.findById(productId);
  if (!p || p.stock < qty) return false;
  p.stock -= qty;          // 이 사이에 다른 요청이 끼어들면 둘 다 성공 → 재고 초과 판매
  await p.save();
  return true;
}
```

### ✅ 올바른 방식 (조건 + 차감을 한 번에)
```ts
export async function decreaseStock(productId: string, qty: number, session?: ClientSession) {
  const result = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },   // 재고가 충분할 때만
    { $inc: { stock: -qty } },                  // 차감
    { new: true, session },
  );
  return result !== null;                       // null이면 품절
}
```

**발표 포인트**: 재고 10개 상품에 100명이 동시에 주문 → 잘못된 방식은 10개보다 많이 팔리고, 올바른 방식은 정확히 10개만 팔림.

---

## 6. 핵심 ② 쿠폰 중복 사용 차단 — 같은 원리

```ts
// lib/coupons.ts
export async function useCoupon(couponId: string, userId: string, session?: ClientSession) {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, userId, used: false },     // 내 쿠폰 + 아직 안 쓴 것만
    { $set: { used: true } },
    { new: true, session },
  );
  if (!coupon) throw new Error("사용할 수 없는 쿠폰입니다.");
  return coupon.discount;
}
```
같은 쿠폰으로 동시에 여러 번 주문해도 **1번만** 성공합니다.

---

## 7. 핵심 ③ 주문 생성 — 트랜잭션 하나로 묶기

재고 차감, 쿠폰 사용, 주문 저장 중 하나라도 실패하면 **전부 없던 일**로 돌립니다.

```ts
// lib/orders.ts
export async function createOrder(userId: string, couponId?: string) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let orderId = "";
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) throw new Error("장바구니가 비었습니다.");

      // 1) 가격은 DB에서 다시 가져온다 (화면에서 보낸 가격은 믿지 않음)
      const items = [];
      for (const it of cart.items) {
        const p = await Product.findById(it.productId).session(session);
        if (!p) throw new Error("없는 상품입니다.");
        // 2) 재고 차감
        const ok = await decreaseStock(p._id, it.qty, session);
        if (!ok) throw new Error(`${p.name} 재고가 부족합니다.`);
        items.push({ productId: p._id, name: p.name, price: p.price, qty: it.qty });
      }

      // 3) 금액 계산 + 쿠폰
      let total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      if (couponId) total = Math.max(0, total - (await useCoupon(couponId, userId, session)));

      // 4) 주문 저장 + 장바구니 비우기
      const [order] = await Order.create([{ userId, items, couponId, totalAmount: total }], { session });
      await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
      orderId = String(order._id);
    });
    return orderId;
  } finally {
    await session.endSession();
  }
}
```
> ⚠️ 트랜잭션 안의 쿼리에는 전부 `session`을 넘겨야 롤백됩니다. 하나라도 빠뜨리면 그 부분은 롤백이 안 돼요.

---

## 8. 핵심 ④ 주문 상태 바꾸기

허용된 상태 변경만 표로 정해두고, 그 외 요청은 서버에서 거절합니다.

```
PENDING(결제대기) ──결제──▶ PAID(결제완료) ──관리자──▶ SHIPPING(배송중) ──관리자──▶ DELIVERED(배송완료)
     │                         │
     └────────취소─────────────┴──▶ CANCELLED(취소)
```

```ts
// lib/orders.ts
const ALLOWED: Record<string, string[]> = {
  PENDING:  ["PAID", "CANCELLED"],
  PAID:     ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function changeStatus(orderId: string, from: string, to: string) {
  if (!ALLOWED[from]?.includes(to)) throw new Error("허용되지 않은 상태 변경입니다.");
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: from },      // 지금 상태가 from일 때만 바뀜
    { $set: { status: to } },
    { new: true },
  );
  if (!order) throw new Error("주문 상태가 이미 바뀌었습니다.");
  return order;
}
```

### 가짜 결제 + 15분 만료
```ts
export async function payOrder(orderId: string, userId: string) {
  const order = await Order.findOne({ _id: orderId, userId });          // 본인 주문만
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  const FIFTEEN_MIN = 15 * 60 * 1000;
  if (Date.now() - order.createdAt.getTime() > FIFTEEN_MIN) {
    await cancelOrder(orderId, userId);                                 // 시간 초과 → 자동 취소
    throw new Error("결제 시간이 지나 주문이 취소되었습니다.");
  }
  return changeStatus(orderId, "PENDING", "PAID");
}
```
실제 결제창 없이 "결제하기" 버튼 → 서버가 **DB 기준 금액**으로 처리합니다.

### 취소 = 재고·쿠폰 되돌리기
`cancelOrder()`: 트랜잭션 안에서 `changeStatus(→ CANCELLED)` + 각 상품 `$inc: { stock: +qty }` + 쿠폰 `used: false`.

---

## 9. 핵심 ⑤ 보안 — 수업 내용으로 체크

### 로그인/관리자 확인 (모든 액션 첫 줄에)
```ts
// lib/authz.ts
import { auth } from "@/auth";
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("관리자만 가능합니다.");
  return user;
}
```
`auth.ts`의 `callbacks`에서 `id`, `role`을 세션에 넣어줘야 합니다 (7주차 코드에 콜백 2개 추가).

> ⚠️ Server Action은 버튼을 숨겨도 **외부에서 직접 호출할 수 있습니다.** 그래서 화면이 아니라 **액션 함수 안에서** 확인해야 합니다.

### 보안 체크리스트
| 위협 | 우리가 하는 것 | 관련 수업 |
|---|---|---|
| 남의 주문 보기/취소 (IDOR) | `Order.findOne({ _id, userId })` — 항상 내 userId 조건 포함 | 9주차 |
| 일반 유저가 관리자 기능 | `requireAdmin()` | 9주차 |
| 금액 조작 | 가격·총액은 서버가 DB로 계산, 화면 값 무시 | — |
| NoSQL Injection | 폼 값은 `String(formData.get(...))`로 변환해서만 사용 | 12주차 |
| XSS | React가 자동 처리, `dangerouslySetInnerHTML` 쓰지 않기 | 12주차 |
| 비밀번호 유출 | bcrypt 해싱 | 7주차 |
| 시크릿 유출 | `.env.local` + Vercel 환경변수, 커밋 금지 | 6·13주차 |
| 에러로 내부 정보 노출 | `error.tsx`에 일반 문구만 | 6주차 |
| 클릭재킹 등 | `next.config.ts`에 보안 헤더 몇 줄 | 12~14주차 |

```ts
// next.config.ts — 보안 헤더 (복붙 수준)
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};
export default nextConfig;
```

---

## 10. 동시성 테스트 — 스크립트 하나로

JMeter 대신 Node 스크립트로 100건을 동시에 보냅니다.

```ts
// app/api/test/order/route.ts  (로컬 테스트 전용 — 배포 전 삭제 또는 env로 막기)
export async function POST(req: Request) {
  if (process.env.ENABLE_TEST !== "true") return new Response("Not found", { status: 404 });
  const { productId, mode } = await req.json();
  const ok = mode === "bad"
    ? await decreaseStockBad(String(productId), 1)
    : await decreaseStock(String(productId), 1);
  return Response.json({ ok });
}
```

```js
// scripts/race-test.mjs   실행: node scripts/race-test.mjs <상품ID> bad|good
const [productId, mode] = process.argv.slice(2);
const results = await Promise.all(
  Array.from({ length: 100 }, () =>
    fetch("http://localhost:3000/api/test/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, mode }),
    }).then((r) => r.json()),
  ),
);
console.log("성공:", results.filter((r) => r.ok).length, "/ 100");
```

**결과 표 (발표용)**
| 방식 | 시작 재고 | 성공한 주문 | 남은 재고 | 정상? |
|---|---|---|---|---|
| bad | 10 | ? (10보다 많을 수 있음) | ? | ❌ |
| good | 10 | 10 | 0 | ✅ |

쿠폰도 같은 방식으로 "같은 쿠폰 20번 동시 사용 → 1번만 성공"을 보여주면 됩니다.

---

## 11. 역할 분담 (간소화)

| 이름 | 맡을 것 |
|---|---|
| 김민재 (팀장) | `lib/orders.ts` — 주문 생성 트랜잭션, 상태 변경, 결제/취소 |
| 정호진 | `models/*` 스키마 5개, `lib/coupons.ts`, 데이터 구조 그림 |
| 정일재 | `lib/products.ts` 재고 차감 2방식, 테스트 스크립트, 결과 표 |
| 조하율 | 로그인/회원가입(7주차), role, `lib/authz.ts`, 장바구니, 화면 |
| 권도영 | 보안 체크리스트 점검, 보안 헤더, 공격 시나리오 캡처(남의 주문 접근 등) |

---

## 12. 일정

| 주차 | 할 일 |
|---|---|
| 8 (중간) | 기획서 발표, 레포 생성, 스키마 확정 |
| 9~10 | 로그인/role, 상품·장바구니 화면, 재고 차감 2방식 |
| 11 | 주문 트랜잭션, 상태 변경, 쿠폰, 가짜 결제 |
| 12~13 | 보안 체크리스트 점검, 동시성 테스트, 결과 캡처 |
| 14~15 | 정리, 발표 준비 |

**시간이 남으면 추가할 것** (선택): 정률 쿠폰, 포인트, 로그인 Rate Limit, 낙관적 락 방식 추가 비교

---

## 13. 협업 규칙

- `feature/이름-기능` 브랜치 → PR → 1명 확인 후 merge (5주차 방식)
- 각자 **본인 계정으로 커밋** (기말 개인 기여도 보고서 근거)
- `.env.local` 절대 커밋 금지. 필요한 키는 `.env.local.example`에 이름만:
  ```
  MONGODB_URI=
  AUTH_SECRET=
  ENABLE_TEST=false
  ```
- AI 사용 시 무엇을 물어봤고 어떻게 확인했는지 PR 설명에 한 줄 남기기 (평가 항목)
