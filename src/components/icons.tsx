import type { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        {...props}
    >
        <rect width="256" height="256" fill="none" />
        <path
            d="M88,134.4,40,160V80l48,25.6Z"
            opacity="0.2"
        />
        <path
            d="M215.8,79.8l-80-40a.9.9,0,0,0-.8,0l-80,40a1,1,0,0,0,0,1.8l80,42.8a.9.9,0,0,0,.8,0l80-42.8a1,1,0,0,0,0-1.8Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
        />
        <path
            d="M40,80v80l48-25.6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
        />
        <path
            d="M216,80v80l-80,42.8V122.8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
        />
    </svg>
);
