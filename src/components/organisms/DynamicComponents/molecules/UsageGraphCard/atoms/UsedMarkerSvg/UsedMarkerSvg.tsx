import React, { FC } from 'react'

export const UsedMarkerSvg: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="37" viewBox="0 0 14 37" fill="none">
    <g filter="url(#filter0_d_2204_25471)">
      <path
        d="M8 7.82617C9.16468 7.41406 10 6.30585 10 5C10 3.34315 8.65685 2 7 2C5.34315 2 4 3.34315 4 5C4 6.30585 4.83532 7.41406 6 7.82617V31H8V7.82617Z"
        fill="#FF1C1C"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_2204_25471"
        x="0"
        y="0"
        width="14"
        height="37"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2204_25471" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2204_25471" result="shape" />
      </filter>
    </defs>
  </svg>
)
