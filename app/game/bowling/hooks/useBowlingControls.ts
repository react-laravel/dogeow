import { useState, useRef, useCallback, useEffect } from 'react'
import { useBowlingStore } from '../store'

export function useBowlingControls() {
  const [isCharging, setIsCharging] = useState(false)
  const [chargePower, setChargePower] = useState(0)
  const [chargeStartTime, setChargeStartTime] = useState(0)
  const [currentAimAngle, setCurrentAimAngle] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    ballThrown,
    canThrow,
    aimAngle,
    tiltX,
    gyroSupported,
    gyroPermission,
    showingResult,
    setPower,
    setAimAngle,
    throwBall,
  } = useBowlingStore()

  // 实时更新瞄准角度（根据陀螺仪数据或默认角度）
  // 目标角度可直接派生，在渲染期间同步本地状态，避免在 effect 中 setState
  const gyroActive = gyroSupported && gyroPermission
  const targetAimAngle = gyroActive ? Math.max(-30, Math.min(30, tiltX * 30)) : aimAngle
  const shouldSyncAim = canThrow && !ballThrown && !showingResult
  if (shouldSyncAim && currentAimAngle !== targetAimAngle) {
    setCurrentAimAngle(targetAimAngle)
  }

  // 只有在陀螺仪可用时才更新 store 中的角度（外部副作用保留在 effect 中）
  useEffect(() => {
    if (shouldSyncAim && gyroActive) {
      setAimAngle(targetAimAngle)
    }
  }, [shouldSyncAim, gyroActive, targetAimAngle, setAimAngle])

  // 手动角度调整函数
  const updateManualAngle = useCallback(
    (
      event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
      canvasElement: HTMLCanvasElement
    ) => {
      if (!canvasElement || (gyroSupported && gyroPermission)) return

      const rect = canvasElement.getBoundingClientRect()
      let clientX = 0

      if ('clientX' in event) {
        clientX = event.clientX
      } else if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX
      }

      const centerX = rect.left + rect.width / 2
      const offsetX = clientX - centerX
      const maxOffset = rect.width / 4
      const normalizedOffset = Math.max(-1, Math.min(1, offsetX / maxOffset))
      const newAngle = normalizedOffset * 30

      setCurrentAimAngle(newAngle)
      setAimAngle(newAngle)
    },
    [gyroSupported, gyroPermission, setAimAngle]
  )

  // 开始蓄力
  const startCharging = useCallback(
    (event?: React.MouseEvent | React.TouchEvent, canvasElement?: HTMLCanvasElement) => {
      if (!canThrow || ballThrown || showingResult) return

      console.log('🎯 开始蓄力')
      setIsCharging(true)
      setIsDragging(true)
      setChargePower(20)
      const startTime = Date.now()
      setChargeStartTime(startTime)

      // 如果没有陀螺仪支持，使用鼠标/触摸位置来设置角度
      if (event && canvasElement && (!gyroSupported || !gyroPermission)) {
        updateManualAngle(event, canvasElement)
      }

      chargeIntervalRef.current = setInterval(() => {
        setChargePower(prev => {
          const next = prev + 2
          return next > 100 ? 20 : next
        })
      }, 50)
    },
    [canThrow, ballThrown, showingResult, gyroSupported, gyroPermission, updateManualAngle]
  )

  // 结束蓄力并投球
  const endCharging = useCallback(() => {
    if (!isCharging) return

    const chargeDuration = Date.now() - chargeStartTime
    console.log('🚀 结束蓄力，投球！', {
      power: chargePower,
      angle: currentAimAngle,
      chargeDuration: `${chargeDuration}ms`,
    })
    setIsCharging(false)
    setIsDragging(false)
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }

    setPower(chargePower)
    throwBall()
    setChargePower(0)
  }, [isCharging, chargePower, currentAimAngle, chargeStartTime, setPower, throwBall])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current)
      }
    }
  }, [])

  return {
    isCharging,
    chargePower,
    currentAimAngle,
    isDragging,
    startCharging,
    endCharging,
    updateManualAngle,
  }
}
