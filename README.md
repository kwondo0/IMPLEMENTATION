# SecureCommerce

수업 프로젝트용 소형 커머스 앱입니다. 상품/장바구니/주문, 가짜 결제, 쿠폰 1회 사용, 관리자 기능과 재고 동시성 비교를 포함합니다.

## 시작하기

1. Node.js 20.9 이상과 MongoDB Atlas URI(Replica Set 지원)를 준비합니다. 주문 생성 및 취소는 MongoDB 트랜잭션을 사용합니다.
2. `.env.local.example`을 `.env.local`로 복사해 `MONGODB_URI`와 `AUTH_SECRET`을 입력합니다. 시크릿은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`로 만들 수 있습니다.
3. `npm install`, `npm run dev`를 실행한 뒤 `http://localhost:3000`에 접속합니다.
4. `/register`에서 회원가입합니다. 일반 회원의 role은 항상 `user`이며, 관리자 계정은 MongoDB Atlas의 `users` 컬렉션에서 해당 계정 문서의 `role`을 `admin`으로 변경합니다. 변경 후 로그아웃하고 다시 로그인해야 새 role이 세션에 반영됩니다.
5. 관리자로 로그인한 뒤 `/admin`에서 상품을 등록하고 주문의 배송 상태를 변경하거나, 회원 이메일을 지정해 정액 쿠폰을 발급할 수 있습니다.

## 보안/동시성 메모

- 서버 액션은 세션에서 사용자 ID를 가져오며, 관리자 작업마다 role을 확인합니다. 주문 조회/결제/취소는 주문 소유자 조건을 포함합니다.
- 금액은 DB 상품 가격과 서버의 계산으로 정하고, 재고·쿠폰·주문 변경은 트랜잭션/조건부 업데이트로 처리합니다.
- 동시성 테스트를 할 때만 `.env.local`의 `ENABLE_TEST=true`로 바꾸고 개발 서버를 재시작하세요. `/api/test/order`는 개발 모드에서만 동작하며 배포 환경에서는 항상 404를 반환합니다. 테스트 후에는 `false`로 되돌리세요.
- `node scripts/race-test.mjs <상품ID> bad|good`로 로컬 서버에 동시 요청 100건을 보낼 수 있습니다. 각 테스트 전에 MongoDB Atlas에서 상품 재고를 10으로 초기화하세요. `bad` 방식은 경쟁 조건 재현용이며 결과가 실행 환경에 따라 달라질 수 있고 실제 구매에는 사용하지 않습니다. `good` 방식의 성공 요청은 재고 10개일 때 최대 10건입니다.
- MongoDB URI 및 Auth secret은 `.env.local`에만 보관하고 저장소에 올리지 마세요.

## 검증

`npm run typecheck`, `npm run lint`, `npm run build`
