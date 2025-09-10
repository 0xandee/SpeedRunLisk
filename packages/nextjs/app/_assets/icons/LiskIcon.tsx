import { SVGProps } from "react";

type LiskIconProps = SVGProps<SVGSVGElement>;

const LiskIcon = ({ ...props }: LiskIconProps) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Contract Address</title>
    <circle cx="16" cy="16" r="14" fill="#4070F4" />
    <path d="M8 20h4v4H8v-4zM12 12h4v12h-4V12zM16 8h4v16h-4V8zM20 14h4v10h-4V14z" fill="white" />
  </svg>
);

export default LiskIcon;
