import { describe, expect, it } from "vitest"
import { detectImageContentType } from "./supabase-storage"

describe("detectImageContentType [NFR-SEC-02]", () => {
  it("JPEG・PNG・WebPのmagic bytesを許可する", () => {
    expect(detectImageContentType(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg")
    expect(detectImageContentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png")
    expect(detectImageContentType(Buffer.from("RIFFxxxxWEBP", "ascii"))).toBe("image/webp")
  })

  it("SVG・申告MIMEだけの偽装・空データを拒否する", () => {
    expect(detectImageContentType(Buffer.from("<svg><script/></svg>"))).toBeNull()
    expect(detectImageContentType(Buffer.from("not an image"))).toBeNull()
    expect(detectImageContentType(Buffer.alloc(0))).toBeNull()
  })
})
