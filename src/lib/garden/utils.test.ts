import { describe, it, expect } from "vitest"
import { scoreToGardenItemType } from "./utils"

describe("scoreToGardenItemType", () => {
  describe("得点・満点によるアイテム判定", () => {
    it("満点(100%)は bamboo を返す", () => {
      expect(scoreToGardenItemType(100, 100, null)).toBe("bamboo")
    })

    it("90点/100点(90%)は cherry を返す", () => {
      expect(scoreToGardenItemType(90, 100, null)).toBe("cherry")
    })

    it("89点/100点(89%)は tree を返す", () => {
      expect(scoreToGardenItemType(89, 100, null)).toBe("tree")
    })

    it("80点/100点(80%)は tree を返す", () => {
      expect(scoreToGardenItemType(80, 100, null)).toBe("tree")
    })

    it("79点/100点(79%)は bush を返す", () => {
      expect(scoreToGardenItemType(79, 100, null)).toBe("bush")
    })

    it("60点/100点(60%)は bush を返す", () => {
      expect(scoreToGardenItemType(60, 100, null)).toBe("bush")
    })

    it("59点/100点(59%)は flower を返す", () => {
      expect(scoreToGardenItemType(59, 100, null)).toBe("flower")
    })

    it("0点/100点(0%)は flower を返す", () => {
      expect(scoreToGardenItemType(0, 100, null)).toBe("flower")
    })

    it("配点ゼロ(maxScore=0)の場合は null を返す（devision by zero 回避）", () => {
      expect(scoreToGardenItemType(0, 0, null)).toBeNull()
    })

    it("満点でない場合でも得点率が1.0以上なら bamboo（200点/200点）", () => {
      expect(scoreToGardenItemType(200, 200, null)).toBe("bamboo")
    })
  })

  describe("偏差値によるアイテム判定", () => {
    it("偏差値70以上は bamboo を返す", () => {
      expect(scoreToGardenItemType(null, null, 70)).toBe("bamboo")
      expect(scoreToGardenItemType(null, null, 75)).toBe("bamboo")
    })

    it("偏差値65以上70未満は cherry を返す", () => {
      expect(scoreToGardenItemType(null, null, 65)).toBe("cherry")
      expect(scoreToGardenItemType(null, null, 69)).toBe("cherry")
    })

    it("偏差値60以上65未満は tree を返す", () => {
      expect(scoreToGardenItemType(null, null, 60)).toBe("tree")
      expect(scoreToGardenItemType(null, null, 64)).toBe("tree")
    })

    it("偏差値50以上60未満は bush を返す", () => {
      expect(scoreToGardenItemType(null, null, 50)).toBe("bush")
      expect(scoreToGardenItemType(null, null, 59)).toBe("bush")
    })

    it("偏差値50未満は flower を返す", () => {
      expect(scoreToGardenItemType(null, null, 49)).toBe("flower")
      expect(scoreToGardenItemType(null, null, 30)).toBe("flower")
    })
  })

  describe("得点が偏差値より優先される", () => {
    it("得点あり・偏差値ありの場合は得点パスで判定する", () => {
      // 得点率50%(flower)、偏差値70(bamboo) → 得点パスが優先されて flower
      expect(scoreToGardenItemType(50, 100, 70)).toBe("flower")
    })

    it("得点率90%・偏差値30の場合は cherry（得点優先）", () => {
      expect(scoreToGardenItemType(90, 100, 30)).toBe("cherry")
    })
  })

  describe("データなしのケース", () => {
    it("score・maxScore・deviation がすべて null の場合は null を返す", () => {
      expect(scoreToGardenItemType(null, null, null)).toBeNull()
    })

    it("score のみ null で maxScore あり → 偏差値パスにフォールバック", () => {
      // score=null → maxScore チェック条件(score !== null)が false → deviation パスへ
      expect(scoreToGardenItemType(null, 100, 70)).toBe("bamboo")
    })

    it("maxScore のみ null → 偏差値パスにフォールバック", () => {
      expect(scoreToGardenItemType(80, null, 40)).toBe("flower")
    })
  })
})
