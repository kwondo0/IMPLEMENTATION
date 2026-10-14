const [productId, mode] = process.argv.slice(2);

if (!productId || !/^[a-f\d]{24}$/i.test(productId) || !["bad", "good"].includes(mode)) {
  console.error("사용법: node scripts/race-test.mjs <상품ID> bad|good");
  process.exitCode = 1;
} else {
  const responses = await Promise.all(
    Array.from({ length: 100 }, () =>
      fetch("http://localhost:3000/api/test/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, mode }),
      }),
    ),
  );
  const failed = responses.filter((response) => !response.ok);
  if (failed.length > 0) {
    console.error(`요청 ${failed.length}건이 실패했습니다. 서버와 ENABLE_TEST 설정을 확인하세요.`);
    process.exitCode = 1;
  } else {
    const results = await Promise.all(responses.map((response) => response.json()));
    console.log(`방식: ${mode}`);
    console.log(`성공: ${results.filter((result) => result.ok).length} / ${results.length}`);
    console.log("bad 모드는 경쟁 조건 재현용이며 실제 재고 처리에 사용하지 마세요.");
  }
}
