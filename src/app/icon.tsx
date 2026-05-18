import { ImageResponse } from "next/og"

export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 192,
        height: 192,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
        borderRadius: 40,
        fontSize: 110,
      }}
    >
      🌲
    </div>,
    { width: 192, height: 192 }
  )
}
