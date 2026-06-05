function vibrate(pattern: VibratePattern) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}

export const haptic = {
  tap:     () => vibrate(8),
  success: () => vibrate(50),
  error:   () => vibrate([40, 30, 40]),
  snap:    () => vibrate(15),
}
