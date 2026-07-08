import { type SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardSquare01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M13.6903 19.4567C13.5 18.9973 13.5 18.4149 13.5 17.25C13.5 16.0851 13.5 15.5027 13.6903 15.0433C13.944 14.4307 14.4307 13.944 15.0433 13.6903C15.5027 13.5 16.0851 13.5 17.25 13.5C18.4149 13.5 18.9973 13.5 19.4567 13.6903C20.0693 13.944 20.556 14.4307 20.8097 15.0433C21 15.5027 21 16.0851 21 17.25C21 18.4149 21 18.9973 20.8097 19.4567C20.556 20.0693 20.0693 20.556 19.4567 20.8097C18.9973 21 18.4149 21 17.25 21C16.0851 21 15.5027 21 15.0433 20.8097C14.4307 20.556 13.944 20.0693 13.6903 19.4567Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M13.6903 8.95671C13.5 8.49728 13.5 7.91485 13.5 6.75C13.5 5.58515 13.5 5.00272 13.6903 4.54329C13.944 3.93072 14.4307 3.44404 15.0433 3.1903C15.5027 3 16.0851 3 17.25 3C18.4149 3 18.9973 3 19.4567 3.1903C20.0693 3.44404 20.556 3.93072 20.8097 4.54329C21 5.00272 21 5.58515 21 6.75C21 7.91485 21 8.49728 20.8097 8.95671C20.556 9.56928 20.0693 10.056 19.4567 10.3097C18.9973 10.5 18.4149 10.5 17.25 10.5C16.0851 10.5 15.5027 10.5 15.0433 10.3097C14.4307 10.056 13.944 9.56928 13.6903 8.95671Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3.1903 19.4567C3 18.9973 3 18.4149 3 17.25C3 16.0851 3 15.5027 3.1903 15.0433C3.44404 14.4307 3.93072 13.944 4.54329 13.6903C5.00272 13.5 5.58515 13.5 6.75 13.5C7.91485 13.5 8.49728 13.5 8.95671 13.6903C9.56928 13.944 10.056 14.4307 10.3097 15.0433C10.5 15.5027 10.5 16.0851 10.5 17.25C10.5 18.4149 10.5 18.9973 10.3097 19.4567C10.056 20.0693 9.56928 20.556 8.95671 20.8097C8.49728 21 7.91485 21 6.75 21C5.58515 21 5.00272 21 4.54329 20.8097C3.93072 20.556 3.44404 20.0693 3.1903 19.4567Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3.1903 8.95671C3 8.49728 3 7.91485 3 6.75C3 5.58515 3 5.00272 3.1903 4.54329C3.44404 3.93072 3.93072 3.44404 4.54329 3.1903C5.00272 3 5.58515 3 6.75 3C7.91485 3 8.49728 3 8.95671 3.1903C9.56928 3.44404 10.056 3.93072 10.3097 4.54329C10.5 5.00272 10.5 5.58515 10.5 6.75C10.5 7.91485 10.5 8.49728 10.3097 8.95671C10.056 9.56928 9.56928 10.056 8.95671 10.3097C8.49728 10.5 7.91485 10.5 6.75 10.5C5.58515 10.5 5.00272 10.5 4.54329 10.3097C3.93072 10.056 3.44404 9.56928 3.1903 8.95671Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function UserGroupIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M15.4827 11.3499C15.8047 11.4475 16.1462 11.5 16.5 11.5C18.433 11.5 20 9.933 20 8C20 6.067 18.433 4.5 16.5 4.5C14.6851 4.5 13.1928 5.8814 13.0173 7.65013" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M17.5 19.5C17.5 16.7386 15.0376 14.5 12 14.5C8.96243 14.5 6.5 16.7386 6.5 19.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function PaintBoardIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.8417 22 14 22.1163 14 21C14 20.391 13.6832 19.9212 13.3686 19.4544C12.9082 18.7715 12.4523 18.0953 13 17C13.6667 15.6667 14.7778 15.6667 16.4815 15.6667C17.3334 15.6667 18.3334 15.6667 19.5 15.5C21.601 15.1999 22 13.9084 22 12Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.125 15H7M7.25 15C7.25 15.1381 7.13807 15.25 7 15.25C6.86193 15.25 6.75 15.1381 6.75 15C6.75 14.8619 6.86193 14.75 7 14.75C7.13807 14.75 7.25 14.8619 7.25 15Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Settings02Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Logout01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M15.5 8.04045C15.4588 6.87972 15.3216 6.15451 14.8645 5.58671C14.2114 4.77536 13.0944 4.52064 10.8605 4.01121L9.85915 3.78286C6.4649 3.00882 4.76777 2.6218 3.63388 3.51317C2.5 4.40454 2.5 6.1257 2.5 9.56803V14.432C2.5 17.8743 2.5 19.5955 3.63388 20.4868C4.76777 21.3782 6.4649 20.9912 9.85915 20.2171L10.8605 19.9888C13.0944 19.4794 14.2114 19.2246 14.8645 18.4133C15.3216 17.8455 15.4588 17.1203 15.5 15.9595" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M18.5 9.01172C18.5 9.01172 21.5 11.2212 21.5 12.0117C21.5 12.8023 18.5 15.0117 18.5 15.0117M21 12.0117H8.49998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function GridViewIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M3.88884 9.66294C4.39329 10 5.09552 10 6.49998 10C7.90445 10 8.60668 10 9.11113 9.66294C9.32951 9.51702 9.51701 9.32952 9.66292 9.11114C9.99998 8.60669 9.99998 7.90446 9.99998 6.5C9.99998 5.09554 9.99998 4.39331 9.66292 3.88886C9.51701 3.67048 9.32951 3.48298 9.11113 3.33706C8.60668 3 7.90445 3 6.49998 3C5.09552 3 4.39329 3 3.88884 3.33706C3.67046 3.48298 3.48296 3.67048 3.33705 3.88886C2.99998 4.39331 2.99998 5.09554 2.99998 6.5C2.99998 7.90446 2.99998 8.60669 3.33705 9.11114C3.48296 9.32952 3.67046 9.51702 3.88884 9.66294Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M14.8888 9.66294C15.3933 10 16.0955 10 17.5 10C18.9044 10 19.6067 10 20.1111 9.66294C20.3295 9.51702 20.517 9.32952 20.6629 9.11114C21 8.60669 21 7.90446 21 6.5C21 5.09554 21 4.39331 20.6629 3.88886C20.517 3.67048 20.3295 3.48298 20.1111 3.33706C19.6067 3 18.9044 3 17.5 3C16.0955 3 15.3933 3 14.8888 3.33706C14.6705 3.48298 14.483 3.67048 14.337 3.88886C14 4.39331 14 5.09554 14 6.5C14 7.90446 14 8.60669 14.337 9.11114C14.483 9.32952 14.6705 9.51702 14.8888 9.66294Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3.88884 20.6629C4.39329 21 5.09552 21 6.49998 21C7.90445 21 8.60668 21 9.11113 20.6629C9.32951 20.517 9.51701 20.3295 9.66292 20.1111C9.99998 19.6067 9.99998 18.9045 9.99998 17.5C9.99998 16.0955 9.99998 15.3933 9.66292 14.8889C9.51701 14.6705 9.32951 14.483 9.11113 14.3371C8.60668 14 7.90445 14 6.49998 14C5.09552 14 4.39329 14 3.88884 14.3371C3.67046 14.483 3.48296 14.6705 3.33705 14.8889C2.99998 15.3933 2.99998 16.0955 2.99998 17.5C2.99998 18.9045 2.99998 19.6067 3.33705 20.1111C3.48296 20.3295 3.67046 20.517 3.88884 20.6629Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M14.8888 20.6629C15.3933 21 16.0955 21 17.5 21C18.9044 21 19.6067 21 20.1111 20.6629C20.3295 20.517 20.517 20.3295 20.6629 20.1111C21 19.6067 21 18.9045 21 17.5C21 16.0955 21 15.3933 20.6629 14.8889C20.517 14.6705 20.3295 14.483 20.1111 14.3371C19.6067 14 18.9044 14 17.5 14C16.0955 14 15.3933 14 14.8888 14.3371C14.6705 14.483 14.483 14.6705 14.337 14.8889C14 15.3933 14 16.0955 14 17.5C14 18.9045 14 19.6067 14.337 20.1111C14.483 20.3295 14.6705 20.517 14.8888 20.6629Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Image01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 21C9.37246 15.775 14.2741 8.88406 21.4975 13.5424" stroke="currentColor" strokeWidth="1.5" />
    </Icon>
  );
}

export function UserCircleIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M15.5 10.5C15.5 8.567 13.933 7 12 7C10.067 7 8.5 8.567 8.5 10.5C8.5 12.433 10.067 14 12 14C13.933 14 15.5 12.433 15.5 10.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Notification03Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M20 18.5011L18.349 7.93407C17.8603 4.80601 15.166 2.5 12 2.5C8.83398 2.5 6.13971 4.80601 5.65098 7.93407L4 18.5011" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M20 18.5C20 16.8431 16.4183 15.5 12 15.5C7.58172 15.5 4 16.8431 4 18.5C4 20.1569 7.58172 21.5 12 21.5C16.4183 21.5 20 20.1569 20 18.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M13 18.5H11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function PlusSignIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 4V20M20 12H4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Comment01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function ArrowLeft01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function ArrowRight01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Upload01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M2.99994 17C2.99994 17.93 2.99994 18.395 3.10216 18.7765C3.37956 19.8117 4.18821 20.6204 5.22348 20.8978C5.60498 21 6.06997 21 6.99994 21L16.9999 21C17.9299 21 18.3949 21 18.7764 20.8978C19.8117 20.6204 20.6203 19.8117 20.8977 18.7765C20.9999 18.395 20.9999 17.93 20.9999 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M16.5 7.49993C16.5 7.49993 13.1858 2.99997 12 2.99996C10.8141 2.99995 7.50002 7.49996 7.50002 7.49996M12 3.99996V16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Download01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M2.99969 17.0002C2.99969 17.9302 2.99969 18.3952 3.10192 18.7767C3.37932 19.8119 4.18796 20.6206 5.22324 20.898C5.60474 21.0002 6.06972 21.0002 6.99969 21.0002L16.9997 21.0002C17.9297 21.0002 18.3947 21.0002 18.7762 20.898C19.8114 20.6206 20.6201 19.8119 20.8975 18.7767C20.9997 18.3952 20.9997 17.9302 20.9997 17.0002" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M16.4998 11.5002C16.4998 11.5002 13.1856 16.0002 11.9997 16.0002C10.8139 16.0002 7.49976 11.5002 7.49976 11.5002M11.9997 15.0002V3.00016" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Cancel01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function CheckmarkCircle01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.75C8 12.75 9.6 13.6625 10.4 15C10.4 15 12.8 9.75 16 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function SentIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M21.0477 3.05293C18.8697 0.707363 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.4999 12.5L14.9999 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function Task01Icon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M14.4961 2.00027H9.49609C8.66767 2.00027 7.99609 2.67185 7.99609 3.50027C7.99609 4.3287 8.66767 5.00027 9.49609 5.00027H14.4961C15.3245 5.00027 15.9961 4.3287 15.9961 3.50027C15.9961 2.67185 15.3245 2.00027 14.4961 2.00027Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.99609 15.0003H11.4247M7.99609 11.0003H15.9961" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M15.9961 3.50027C17.5496 3.54709 18.4761 3.72035 19.1174 4.36164C19.9961 5.24032 19.9961 6.65451 19.9961 9.4829L19.9961 15.9997C19.9961 18.8282 19.9961 20.2424 19.1174 21.1211C18.2387 21.9997 16.8245 21.9997 13.9961 21.9997L9.99609 21.9997C7.16767 21.9997 5.75346 21.9997 4.87478 21.1211C3.9961 20.2424 3.9961 18.8282 3.99609 15.9998L3.99611 9.48296C3.9961 6.65453 3.9961 5.24031 4.87478 4.36163C5.51606 3.72034 6.44261 3.54708 7.99599 3.50027" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function ViewIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="currentColor" strokeWidth="1.5" />
    </Icon>
  );
}

export function DollarCircleIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.7102 10.0611C14.6111 9.29844 13.7354 8.06622 12.1608 8.06619C10.3312 8.06616 9.56136 9.07946 9.40515 9.58611C9.16145 10.2638 9.21019 11.6571 11.3547 11.809C14.0354 11.999 15.1093 12.3154 14.9727 13.956C14.836 15.5965 13.3417 15.951 12.1608 15.9129C10.9798 15.875 9.04764 15.3325 8.97266 13.8733M11.9734 6.99805V8.06982M11.9734 15.9031V16.998" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </Icon>
  );
}

// --- Request type icons ---

export function PenToolIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M13.5 2L2 13.5L7.5 13.5L10.5 22L22 10.5L16.5 10.5L13.5 2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M10 14L8 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function SmartPhoneIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M5 9C5 5.70017 5 4.05025 6.02513 3.02513C7.05025 2 8.70017 2 12 2C15.2998 2 16.9497 2 17.9749 3.02513C19 4.05025 19 5.70017 19 9V15C19 18.2998 19 19.9497 17.9749 20.9749C16.9497 22 15.2998 22 12 22C8.70017 22 7.05025 22 6.02513 20.9749C5 19.9497 5 18.2998 5 15V9Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M11 19H13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function BrowserIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 9H22" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6 6.5H6.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 6.5H9.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Icon>
  );
}

export function ColourSwatchIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="1.5" />
    </Icon>
  );
}

export function PresentationIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M2 5H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 5V14.5C3 16.357 3 17.2855 3.58579 17.8713C4.17157 18.4571 5.1 18.4571 6.95714 18.4571H17.0429C18.9 18.4571 19.8284 18.4571 20.4142 17.8713C21 17.2855 21 16.357 21 14.5V5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12 18V22M8 22H16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function MoreHorizontalIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M11.992 12H12.001" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M17.992 12H18.001" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M5.99199 12H6.00099" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </Icon>
  );
}

// --- Priority icons ---

export function LeafIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4.5 20.5C4.5 20.5 8.5 18 12 12C14.5 7.5 14.5 2 21.5 2C21.5 2 21.5 10 17 15C14 18.5 8 20 4.5 20.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3.5 21.5L8.5 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function CalendarIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M18 2V4M6 2V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 8H21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function FireIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9 16 5 14 2C13 4.5 11 6 9.5 6C8 6 4 9 4 14C4 18.4183 7.58172 22 12 22Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M10 17C10 18.1046 10.8954 19 12 19C13.1046 19 14 18.1046 14 17C14 14.5 12 13 12 13C12 13 10 14.5 10 17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function SearchIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M17.5 17.5L22 22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function CanvasIcon({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 8C4 5.17157 4 3.75736 5.00421 2.87868C6.00841 2 7.62465 2 10.8571 2H13.1429C16.3753 2 17.9916 2 18.9958 2.87868C20 3.75736 20 5.17157 20 8V17H4V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 17H21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M10.6987 5.56588C11.9289 5.38957 13.9674 5.4601 12.2803 7.15266C10.1715 9.26836 7.00837 14.0289 10.6987 12.4421C14.3891 10.8554 15.9709 11.9132 14.3893 13.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12 17V21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M5 22L8 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M19 22L16 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </Icon>
  );
}
