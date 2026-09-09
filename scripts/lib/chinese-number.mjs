const DIGITS = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

/**
 * 把中文数字（一、十一、二十一、一百十八）转成整数。
 * @param {string} str
 * @returns {number}
 */
export function chineseToNumber(str) {
  if (str == null || str === '') return Number.NaN
  if (/^\d+$/.test(str)) return Number(str)

  let n = 0
  let s = String(str)

  if (s.includes('百')) {
    const [head, rest] = s.split('百')
    const hundreds = head === '' ? 1 : DIGITS[head]
    if (hundreds == null) return Number.NaN
    n += hundreds * 100
    s = rest.replace(/^零/, '')
    if (!s) return n
  }

  if (s.includes('十')) {
    const [tensHead, rest] = s.split('十')
    const tens = tensHead === '' ? 1 : DIGITS[tensHead]
    if (tens == null) return Number.NaN
    n += tens * 10
    if (rest) {
      if (!(rest in DIGITS)) return Number.NaN
      n += DIGITS[rest]
    }
    return n
  }

  if (s in DIGITS) return n + DIGITS[s]
  return Number.NaN
}
