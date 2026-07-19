/**
 * ジェスチャー駆動UI用の小さなスプリングアニメーション。
 * CSS transition と違い、現在値・現在速度から再ターゲットできるため
 * ドラッグ→アニメーション→再ドラッグの中断がジャンプなしに繋がる。
 */

export type SpringHandle = {
  /** アニメーションを中断し、その瞬間の値と速度(px/s)を返す */
  stop: () => { value: number; velocity: number }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * damping 1.0 = 臨界減衰(バウンスなし)。response はターゲット到達の速さ(秒)。
 * velocity にはジェスチャーのリリース速度(px/s)を渡すと、指の動きが継ぎ目なく引き継がれる。
 */
export function springTo(opts: {
  from: number
  to: number
  velocity?: number
  damping?: number
  response?: number
  onUpdate: (value: number) => void
  onComplete?: () => void
}): SpringHandle {
  const { from, to, velocity = 0, damping = 1, response = 0.3, onUpdate, onComplete } = opts

  if (prefersReducedMotion()) {
    onUpdate(to)
    onComplete?.()
    return { stop: () => ({ value: to, velocity: 0 }) }
  }

  const omega = (2 * Math.PI) / response
  const stiffness = omega * omega
  const dampingCoeff = 2 * damping * omega

  let value = from
  let v = velocity
  let raf = 0
  let last = performance.now()

  function frame(now: number) {
    // タブ非アクティブ復帰などの巨大 dt で発散しないよう刻む
    let dt = Math.min((now - last) / 1000, 0.064)
    last = now
    while (dt > 0) {
      const h = Math.min(dt, 1 / 120)
      const a = stiffness * (to - value) - dampingCoeff * v
      v += a * h
      value += v * h
      dt -= h
    }
    if (Math.abs(to - value) < 0.1 && Math.abs(v) < 4) {
      value = to
      onUpdate(value)
      onComplete?.()
      return
    }
    onUpdate(value)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    stop: () => {
      cancelAnimationFrame(raf)
      return { value, velocity: v }
    },
  }
}

/**
 * リリース速度から慣性の着地点までの距離を予測する(スクロール減速と同じ指数減衰)。
 * スナップ先は「離した位置」ではなく「投げた先」で決める。
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/**
 * 境界を越えた量に応じて抵抗が増すラバーバンド。dimension が漸近上限になる。
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}
