// Frame order is shared by all eight 4×4 animation sheets.
export const FRAME_SIZE = 192
export const FOOTLINE = 175
export type Strike = {
  start: number
  windup: number
  recovery: number
  target: number
  angle: number
  fired: boolean
  kind: 'basic' | 'slam'
}
export type PoseState = {
  age: number
  stride: number
  moving: boolean
  strike: Strike | null
  hitAt: number
  frozen?: boolean
  restingOffset?: number
}
export function unitFrame(state: PoseState, decorativeMotion: boolean) {
  const { age, strike } = state
  if (state.frozen) return 13
  if (strike) {
    const elapsed = age - strike.start
    if (elapsed < strike.windup) return elapsed < strike.windup * 0.5 ? 8 : 9
    if (elapsed < strike.windup + strike.recovery) {
      return elapsed < strike.windup + strike.recovery * 0.48 ? 10 : 11
    }
  }
  const hurt = age - state.hitAt
  if (hurt < 0.14) return hurt < 0.065 ? 12 : 13
  if (state.moving) return 4 + (Math.floor(state.stride) % 4)
  return decorativeMotion ? Math.floor(age * 3.7 + (state.restingOffset ?? 0)) % 4 : 0
}
export function defeatFrame(elapsed: number) {
  return elapsed < 0.16 ? 14 : 15
}
