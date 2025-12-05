import { type SVGProps } from "react";

export function RMPLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="65"
      height="37"
      fill="none"
      viewBox="0 0 65 37"
      {...props}
    >
      <path
        fill="#151515"
        fillRule="evenodd"
        d="M0 0v30.792h5.708L4.61 36.775l11.064-5.983H65L64.869 0H0"
        clipRule="evenodd"
      ></path>
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M14.223 11.68h-1.556v2.838h1.386c.94 0 2.12-.24 2.12-1.48 0-1.135-1.078-1.359-1.95-1.359m2.069 9.808-2.616-4.836h-.99v4.836H9.811V9.304h4.617c2.324 0 4.632.895 4.632 3.683 0 1.635-.957 2.805-2.513 3.287l3.164 5.214zM36.425 21.488l.069-8.621h-.051l-3.146 8.62h-2.052l-3.06-8.62h-.051l.069 8.62H25.45V9.306h4.154l2.753 7.812h.068l2.633-7.812h4.222v12.183zM51.154 12H50v3h1.108C52.093 15 53 14.66 53 13.455 53 12.233 52.093 12 51.154 12m.137 4.475h-1.426V21H47V9h4.358C53.956 9 56 9.95 56 12.695c0 2.78-2.229 3.78-4.71 3.78"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
