export function MonopolyAnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes monopoly-dice-roll {
        0% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
        35% {
          transform: translateY(-7px) rotate(110deg) scale(1.08);
        }
        70% {
          transform: translateY(2px) rotate(250deg) scale(0.96);
        }
        100% {
          transform: translateY(0) rotate(360deg) scale(1);
        }
      }
      @keyframes monopoly-token-hop {
        0% {
          transform: translateY(5px) scale(0.72);
          opacity: 0.3;
        }
        55% {
          transform: translateY(-5px) scale(1.18);
          opacity: 1;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      @keyframes monopoly-tile-pulse {
        0%,
        100% {
          background-color: rgba(14, 165, 233, 0.08);
        }
        50% {
          background-color: rgba(14, 165, 233, 0.22);
        }
      }
    `}</style>
  )
}
