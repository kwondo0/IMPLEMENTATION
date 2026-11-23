export const categories = [
  { id: "desk", label: "데스크", description: "일하는 공간을 편하게 만드는 도구" },
  { id: "living", label: "리빙", description: "매일 손이 가는 생활용품" },
  { id: "stationery", label: "문구", description: "기록하는 시간을 위한 물건" },
] as const;

export type Category = (typeof categories)[number]["id"];
export type ProductInfo = {
  category: Category;
  subtitle: string;
  description: string;
  image: string;
  specs: ReadonlyArray<readonly [string, string]>;
};

export const collection = [
  {
    id: "65ec00000000000000000001", name: "키스톤 75 무선 키보드", price: 129000, stock: 32,
    category: "desk", subtitle: "아이보리 키캡 · 올리브 바디",
    description: "방향키와 기능키는 살리고 여백을 줄인 75% 배열입니다. 무광 아이보리 키캡과 차분한 올리브 컬러가 데스크에 자연스럽게 어울립니다.",
    image: "/store/keyboard.webp",
    specs: [["배열", "75% 컴팩트"], ["연결", "Bluetooth / 2.4 GHz / USB-C"], ["키캡", "PBT 이중사출"], ["스위치", "리니어"]],
  },
  {
    id: "65ec00000000000000000002", name: "오브 크롬 테이블 램프", price: 89000, stock: 24,
    category: "desk", subtitle: "크롬 마감 · 전구색",
    description: "반구형 갓 아래로 부드러운 빛이 퍼집니다. 눈부심을 줄인 하향 조명으로 늦은 저녁의 책상이나 침대 옆에 두기 좋습니다.",
    image: "/store/lamp.webp",
    specs: [["크기", "지름 24 × 높이 31 cm"], ["소재", "크롬 도금 스틸"], ["광원", "LED 2700 K"], ["전원", "220 V 유선"]],
  },
  {
    id: "65ec00000000000000000003", name: "리플 세라믹 머그", price: 18000, stock: 56,
    category: "living", subtitle: "웜 아이보리 · 320 mL",
    description: "잔잔한 세로 결이 들어간 자기 머그입니다. 손가락 두 개가 편하게 들어가는 둥근 손잡이와 넉넉한 용량으로 커피나 차를 담기 좋습니다.",
    image: "/store/mug.webp",
    specs: [["용량", "320 mL"], ["소재", "유약 처리한 자기"], ["색상", "웜 아이보리"], ["관리", "부드러운 스펀지로 세척"]],
  },
  {
    id: "65ec00000000000000000004", name: "오프라인 리넨 노트", price: 15000, stock: 48,
    category: "stationery", subtitle: "차콜 · A5 · 무지",
    description: "단단한 리넨 표지 안에 비침이 적은 미색 종이를 담았습니다. 일상 기록과 스케치에 두루 쓰기 좋은 무지 노트입니다.",
    image: "/store/notebook.webp",
    specs: [["크기", "A5 (148 × 210 mm)"], ["구성", "무지 160쪽"], ["내지", "미색지 100 g/m²"], ["표지", "차콜 리넨 하드커버"]],
  },
] satisfies Array<ProductInfo & { id: string; name: string; price: number; stock: number }>;

export function categoryLabel(id?: string) {
  return categories.find((category) => category.id === id)?.label ?? "기타";
}
