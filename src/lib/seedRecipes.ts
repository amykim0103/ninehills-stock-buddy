import { Recipe } from "./recipeTypes";

let order = 0;
const seed = (
  category: Recipe["category"],
  name: string,
  variants: Recipe["variants"]
): Recipe => ({
  id: `seed-${category}-${name}`.replace(/\s+/g, "-").toLowerCase(),
  name,
  category,
  active: true,
  sortOrder: order++,
  variants,
});

const ing = (name: string, amount: string) => ({
  id: `ing-${name}-${amount}`.replace(/\s+/g, "-"),
  name,
  amount,
});

export function seedRecipes(): Recipe[] {
  order = 0;
  return [
    seed("Signature", "나인힐 라떼", [
      {
        id: "v-ninehill-ice",
        temp: "ice",
        ingredients: [
          ing("에스프레소", "2샷"),
          ing("나인힐 시럽", "20ml"),
          ing("우유", "200ml"),
          ing("얼음", "한컵"),
        ],
      },
      {
        id: "v-ninehill-hot",
        temp: "hot",
        ingredients: [
          ing("에스프레소", "2샷"),
          ing("나인힐 시럽", "15ml"),
          ing("스팀 우유", "220ml"),
        ],
      },
    ]),
    seed("Coffee", "아메리카노", [
      {
        id: "v-am-ice",
        temp: "ice",
        ingredients: [
          ing("에스프레소", "2샷"),
          ing("물", "250ml"),
          ing("얼음", "한컵"),
        ],
      },
      {
        id: "v-am-hot",
        temp: "hot",
        ingredients: [ing("에스프레소", "2샷"), ing("뜨거운 물", "300ml")],
      },
    ]),
    seed("Coffee", "콜드브루", [
      {
        id: "v-cb-ice",
        temp: "ice",
        ingredients: [
          ing("콜드브루 원액", "120ml"),
          ing("물", "120ml"),
          ing("얼음", "한컵"),
        ],
      },
    ]),
    seed("Tea", "얼그레이", [
      {
        id: "v-eg-hot",
        temp: "hot",
        ingredients: [ing("얼그레이 티백", "1개"), ing("뜨거운 물", "300ml")],
      },
    ]),
    seed("Ade", "자몽 에이드", [
      {
        id: "v-grape-ice",
        temp: "ice",
        ingredients: [
          ing("자몽청", "60g"),
          ing("탄산수", "200ml"),
          ing("얼음", "한컵"),
          ing("자몽 슬라이스", "1조각"),
        ],
      },
    ]),
    seed("Smoothie", "딸기 스무디", [
      {
        id: "v-straw-ice",
        temp: "ice",
        ingredients: [
          ing("냉동 딸기", "150g"),
          ing("우유", "150ml"),
          ing("딸기 시럽", "20ml"),
          ing("얼음", "한컵"),
        ],
      },
    ]),
  ];
}
