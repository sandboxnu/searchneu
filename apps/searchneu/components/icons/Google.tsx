export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      id="Layer_1"
      version="1.1"
      viewBox="0 0 24 24"
    >
      <defs>
        <radialGradient
          id="radial-gradient"
          cx="1.479"
          cy="12.788"
          r="9.655"
          fx="1.479"
          fy="12.788"
          gradientTransform="matrix(.8032 0 0 1.0842 2.459 -.293)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.368" stopColor="#ffcf09"></stop>
          <stop offset="0.718" stopColor="#ffcf09" stopOpacity="0.7"></stop>
          <stop offset="1" stopColor="#ffcf09" stopOpacity="0"></stop>
        </radialGradient>
        <radialGradient
          id="radial-gradient1"
          cx="14.295"
          cy="23.291"
          r="11.878"
          fx="14.295"
          fy="23.291"
          gradientTransform="matrix(1.3272 0 0 1.0073 -3.434 -.672)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.383" stopColor="#34a853"></stop>
          <stop offset="0.706" stopColor="#34a853" stopOpacity="0.7"></stop>
          <stop offset="1" stopColor="#34a853" stopOpacity="0"></stop>
        </radialGradient>
        <linearGradient
          id="linear-gradient"
          x1="23.558"
          x2="12.148"
          y1="6.286"
          y2="20.299"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.671" stopColor="#4285f4"></stop>
          <stop offset="0.885" stopColor="#4285f4" stopOpacity="0"></stop>
        </linearGradient>
        <clipPath id="clippath">
          <path
            fill="none"
            d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25"
          ></path>
        </clipPath>
      </defs>
      <path
        fill="#fc4c53"
        d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25"
      ></path>
      <g clipPath="url(#clippath)">
        <ellipse
          cx="3.646"
          cy="13.572"
          fill="url(#radial-gradient)"
          rx="7.755"
          ry="10.469"
        ></ellipse>
        <ellipse
          cx="15.538"
          cy="22.789"
          fill="url(#radial-gradient1)"
          rx="15.765"
          ry="11.965"
          transform="rotate(-7.12 15.539 22.789)"
        ></ellipse>
        <path
          fill="url(#linear-gradient)"
          d="m11.105 8.28.49 5.596.624 3.747 7.362 6.848 8.607-15.897z"
        ></path>
      </g>
    </svg>
  );
}
