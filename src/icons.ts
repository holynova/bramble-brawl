const paths: Record<string, string> = {
  trophy:
    '<path fill="#ffba18" d="M6 4h20v5c0 8-4 12-8 13v4h5l1 4H8l1-4h5v-4C9 20 6 16 6 9Z"/><path fill="none" d="M6 6H2v4c0 5 4 7 8 7m16-11h4v4c0 5-4 7-8 7"/><path stroke="none" fill="#fff3a1" d="M9 6h3v6l-2 2Z"/>',
  gear: '<path fill="#dce8f2" d="m13 2 6 0 1 4 3 1 3-2 4 5-3 3 1 4 3 1-2 6-4-1-3 2v4l-6 1-1-4-4-1-3 2-4-5 3-3-1-4-4-1 2-6 4 1 3-2Z"/><circle cx="16" cy="16" r="5" fill="#475671"/>',
  cards:
    '<path fill="#67b7fc" d="m5 7 14-3 5 20-15 4Z"/><path fill="#f2f5ff" d="m12 5 15 2-3 22-15-2Z"/><path fill="#a57cf0" d="m18 11 4 5-5 6-3-6Z"/>',
  hammer:
    '<path fill="#ba773f" d="m8 28-4-4 15-16 4 5Z"/><path fill="#a9dcf1" d="m11 6 6-4 13 13-5 6-6-6-4 1-7-7Z"/>',
  skull:
    '<path fill="#fff3d5" d="M4 15C4 1 27 0 28 14v7l-5 2-1 5H11l-1-5-6-2Z"/><path fill="#33223c" d="m8 13 6 2-2 4-4-1Zm17 0-7 2 2 4 4-1Z"/><path d="m15 22 2-3 1 3"/>',
  cross: '<path d="m7 7 18 18m0-18L7 25" fill="none" stroke="currentColor" stroke-width="5"/>',
  aim: '<circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 1v9m0 12v9M1 16h9m12 0h9" stroke="currentColor" stroke-width="3"/><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/>',
  play: '<path fill="currentColor" stroke-width="2" d="M6 3 28 16 6 29Z"/>',
  next: '<path fill="none" stroke="currentColor" stroke-width="4" d="m11 6 10 10-10 10"/>',
  pause: '<path fill="currentColor" d="M6 4h7v24H6zm13 0h7v24h-7z"/>',
  lock: '<path fill="none" stroke="currentColor" stroke-width="4" d="M9 14V9a7 7 0 0 1 14 0v5"/><rect fill="currentColor" x="5" y="13" width="22" height="16" rx="3"/>',
  check: '<path fill="none" stroke="currentColor" stroke-width="5" d="m4 16 8 9L29 6"/>',
  bolt: '<path fill="#f9d855" d="M18 1 5 18h9l-3 13L28 11H17Z"/>',
  book: '<path fill="#fec973" d="m2 5 13 1 1 3 2-3 12-2v21l-12 1-2 3-3-3-11-1Z"/><path d="M16 9v17"/>',
  clock: '<circle fill="#d8ebf5" cx="16" cy="18" r="12"/><path d="M16 10v8l5 3M11 2h10"/>',
  star: '<path fill="#ffd65f" d="m16 2 4 9 10 2-7 7 1 10-8-5-9 5 2-10-8-7 11-2Z"/>',
  drop: '<path fill="#ca83ff" d="M16 1C14 8 4 14 4 20c0 15 24 14 24 0 0-7-8-12-12-19Z"/><path fill="#f5ceff" stroke="none" d="M10 20q-2-3 5-11-1 6-2 10Z"/>',
}
export function ico(key: string) {
  return (
    '<svg class="ico" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#392736" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' +
    (paths[key] ?? '') +
    '</svg>'
  )
}
