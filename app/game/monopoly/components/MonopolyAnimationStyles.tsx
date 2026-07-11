export function MonopolyAnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes monopoly-dice-roll {
        0% {
          transform: translateY(0) rotate(-2deg) scale(1);
        }
        22% {
          transform: translateY(-4px) rotate(5deg) scale(1.025);
        }
        48% {
          transform: translateY(-1px) rotate(-5deg) scale(0.99);
        }
        72% {
          transform: translateY(-3px) rotate(3deg) scale(1.015);
        }
        100% {
          transform: translateY(0) rotate(-2deg) scale(1);
        }
      }
      .monopoly-dice {
        transform-origin: center;
        will-change: transform;
      }
      .monopoly-dice-roll {
        animation: monopoly-dice-roll 680ms cubic-bezier(0.37, 0, 0.2, 1) infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .monopoly-dice-roll {
          animation: none;
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
