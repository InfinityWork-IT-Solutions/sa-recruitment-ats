/**
 * Accurate SVG logo components for PNet, Indeed and LinkedIn.
 * Self-contained — no external CDN required.
 */

interface LogoProps {
  className?: string;
  size?: number;
}

export function LinkedInLogo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="72" height="72" rx="8" fill="#0A66C2" />
      <path
        d="M18.5 27.5H27V54H18.5V27.5ZM22.75 23.5C20.125 23.5 18 21.375 18 18.75C18 16.125 20.125 14 22.75 14C25.375 14 27.5 16.125 27.5 18.75C27.5 21.375 25.375 23.5 22.75 23.5ZM54 54H45.5V40.5C45.5 37.375 45.375 33.375 41.125 33.375C36.75 33.375 36.125 36.75 36.125 40.25V54H27.625V27.5H35.75V31.125H35.875C37 29.125 39.625 27 43.5 27C52.125 27 54 32.625 54 40.125V54Z"
        fill="white"
      />
    </svg>
  );
}

export function IndeedLogo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="72" height="72" rx="8" fill="#003A9B" />
      <text
        x="36"
        y="44"
        textAnchor="middle"
        fill="white"
        fontSize="22"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        letterSpacing="-0.5"
      >
        indeed
      </text>
      <circle cx="60" cy="24" r="5" fill="#2164F3" />
    </svg>
  );
}

export function PNetLogo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="72" height="72" rx="8" fill="#E8401C" />
      <text
        x="36"
        y="45"
        textAnchor="middle"
        fill="white"
        fontSize="26"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        letterSpacing="1"
      >
        PNET
      </text>
    </svg>
  );
}
