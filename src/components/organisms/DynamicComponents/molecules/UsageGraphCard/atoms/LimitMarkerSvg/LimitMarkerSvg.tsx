import React, { FC } from 'react'

export const LimitMarkerSvg: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="37" viewBox="0 0 14 37" fill="none">
    <g filter="url(#filter0_d_2204_25507)">
      <path
        d="M8 25.1738C9.16468 25.5859 10 26.6941 10 28C10 29.6569 8.65685 31 7 31C5.34315 31 4 29.6569 4 28C4 26.6941 4.83532 25.5859 6 25.1738V2H8V25.1738Z"
        fill="#FD9125"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_2204_25507"
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
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2204_25507" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2204_25507" result="shape" />
      </filter>
    </defs>
  </svg>
)
