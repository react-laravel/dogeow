import { getBackgroundInfo, getPrimaryColor } from './colors'

type RefLike<T> = {
  current: T
}

type ParticleStar = {
  x: number
  y: number
  z: number
  prevX: number
  prevY: number
}

export type RainDrop = {
  x: number
  y: number
  len: number
  speed: number
  alpha: number
  hue: number
}

const RAIN_GRAVITY = 900 // px/s²，画布向下为正方向
const RAIN_TERMINAL_SPEED = 1000 // px/s

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  particlesRef: RefLike<ParticleStar[]>
) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  ctx.fillRect(0, 0, width, height)

  const stars = particlesRef.current
  const primaryColor = getPrimaryColor()
  const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
  const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255
  const targetCount = Math.floor(20 + avg * 180)

  while (stars.length > targetCount) stars.pop()
  while (stars.length < targetCount) {
    stars.push({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 1000 + 200,
      prevX: 0,
      prevY: 0,
    })
  }

  let baseHue = 35
  if (primaryColor.startsWith('hsl')) {
    const parts = primaryColor.replace(')', '').replace('hsl(', '').split(/\s+/)
    baseHue = parseFloat(parts[0]) || 35
  }

  const cx = width / 2
  const cy = height / 2
  const speed = 1.5 + avg * 10 + bass * 5

  for (const star of stars) {
    star.prevX = (star.x / star.z) * 400 + cx
    star.prevY = (star.y / star.z) * 400 + cy
    star.z -= speed

    if (star.z <= 1) {
      star.x = (Math.random() - 0.5) * width * 2
      star.y = (Math.random() - 0.5) * height * 2
      star.z = 800 + Math.random() * 200
      star.prevX = (star.x / star.z) * 400 + cx
      star.prevY = (star.y / star.z) * 400 + cy
    }

    const sx = (star.x / star.z) * 400 + cx
    const sy = (star.y / star.z) * 400 + cy
    const depth = 1 - star.z / 1000
    const alpha = depth * (0.4 + avg * 0.6)
    const lineW = depth * (1 + bass * 1.5)

    ctx.beginPath()
    ctx.moveTo(star.prevX, star.prevY)
    ctx.lineTo(sx, sy)
    ctx.strokeStyle = `hsla(${baseHue + depth * 30}, 65%, ${75 + depth * 20}%, ${alpha})`
    ctx.lineWidth = lineW
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

export function drawSilk(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  silkPointsRef: RefLike<RainDrop[]>,
  canvasEl?: HTMLCanvasElement | null,
  deltaSeconds = 1 / 60
) {
  const bg = getBackgroundInfo(canvasEl)
  ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.98)`
  ctx.fillRect(0, 0, width, height)

  const drops = silkPointsRef.current
  const avg = dataArray.length
    ? dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
    : 0
  // 恢复页面或卡顿后不补算整段离屏时间，避免雨滴突然跳到底部。
  const dt = Math.max(0, Math.min(deltaSeconds, 0.05))
  const baseHue = 210
  const baseSpawn = Math.floor(1 + avg * 3)
  const expectedSpawns = Math.floor(baseSpawn / 2) * (0.3 + avg * 0.7) * 60 * dt
  const spawnCount = Math.floor(expectedSpawns) + (Math.random() < expectedSpawns % 1 ? 1 : 0)

  for (let i = 0; i < spawnCount && drops.length < 100; i++) {
    drops.push({
      x: Math.random() * width,
      y: -Math.random() * 20,
      len: 5,
      speed: 240 + Math.random() * 240 + avg * 120,
      alpha: 0.4 + Math.random() * 0.3 + avg * 0.3,
      hue: baseHue + Math.random() * 20 - 10,
    })
  }

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i]
    // 每滴雨的 x 保持不变；音乐只影响新雨滴，不在下落途中施加随机推力。
    const accelerationTime = Math.min(dt, (RAIN_TERMINAL_SPEED - drop.speed) / RAIN_GRAVITY)
    drop.y +=
      drop.speed * accelerationTime +
      (RAIN_GRAVITY * accelerationTime ** 2) / 2 +
      RAIN_TERMINAL_SPEED * (dt - accelerationTime)
    drop.speed = Math.min(RAIN_TERMINAL_SPEED, drop.speed + RAIN_GRAVITY * dt)
    drop.len = Math.max(6, drop.speed * 0.016)

    if (drop.y > height + drop.len || drop.x > width + 40 || drop.x < -40) {
      drops.splice(i, 1)
      continue
    }

    ctx.beginPath()
    ctx.setLineDash([])
    ctx.moveTo(drop.x, drop.y)
    ctx.lineTo(drop.x, drop.y - drop.len)
    ctx.strokeStyle = bg.isLight
      ? `hsla(${drop.hue}, 30%, 25%, ${Math.min(0.9, drop.alpha + 0.1)})`
      : `hsla(${drop.hue}, 55%, 80%, ${drop.alpha})`
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  if (avg > 0.15) {
    const gradient = ctx.createLinearGradient(0, height - 30, 0, height)
    gradient.addColorStop(0, `hsla(${baseHue}, 40%, 70%, 0)`)
    gradient.addColorStop(1, `hsla(${baseHue}, 40%, 70%, ${avg * 0.15})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, height - 30, width, 30)
  }
}
