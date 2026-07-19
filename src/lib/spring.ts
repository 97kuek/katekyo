/**
 * 境界を越えた量に応じて抵抗が増すラバーバンド。
 * プルダウン更新で、指の移動量がそのまま伸び続けないようにする。
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}
