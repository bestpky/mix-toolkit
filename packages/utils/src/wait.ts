/**
 * 等待
 * @param ms 毫秒数
 * @returns undefined
 */
export function wait(ms: number) {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve(undefined)
    }, ms)
  )
}
