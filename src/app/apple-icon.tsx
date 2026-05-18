import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
        borderRadius: 40,
        fontSize: 105,
      }}
    >
      🌲
    </div>,
    { width: 180, height: 180 }
  )
}
