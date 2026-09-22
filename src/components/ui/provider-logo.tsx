import React from "react";

export type ProviderType =
  | "TELEGRAM"
  | "DISCORD"
  | "WHATSAPP"
  | "MERCADO_LIVRE"
  | "MERCADOLIVRE"
  | "SHOPEE"
  | "AMAZON"
  | string;

interface ProviderLogoProps {
  provider: ProviderType;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-9 h-9",
  xl: "w-12 h-12",
  "2xl": "w-14 h-14",
};

export function ProviderLogo({ provider, size = "md", className = "" }: ProviderLogoProps) {
  const normalized = (provider || "").toUpperCase().replace(/-/g, "_");
  const sizeClasses = sizeMap[size] || sizeMap.md;

  switch (normalized) {
    case "TELEGRAM":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <circle cx="24" cy="24" r="24" fill="#24A1DE" />
          <path
            d="M10.8 23.6L34.6 14.3C35.7 13.9 36.7 14.6 36.3 15.7L32.2 34.9C31.9 36.3 31 36.6 29.9 35.9L23.7 31.3L20.7 34.2C20.4 34.5 20.1 34.8 19.5 34.8L20 28.4L31.6 17.9C32.1 17.4 31.5 17.2 30.8 17.6L16.5 26.6L10.5 24.7C8.9 24.2 8.9 23.3 10.8 23.6Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "DISCORD":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <rect width="48" height="48" rx="12" fill="#5865F2" />
          <path
            d="M33.8 15.6C31.9 14.7 29.8 14.1 27.6 13.9C27.3 14.4 27 15.1 26.8 15.7C24.4 15.3 22 15.3 19.7 15.7C19.4 15.1 19.1 14.4 18.8 13.9C16.6 14.1 14.5 14.7 12.6 15.6C8.7 21.4 7.6 27.1 8.2 32.7C10.8 34.6 13.3 35.8 15.7 36.5C16.3 35.7 16.8 34.8 17.3 33.9C16.4 33.6 15.6 33.1 14.8 32.6C15 32.4 15.2 32.3 15.4 32.1C20.4 34.4 25.9 34.4 30.8 32.1C31 32.3 31.2 32.4 31.4 32.6C30.6 33.1 29.8 33.6 28.9 33.9C29.4 34.8 30 35.7 30.5 36.5C33 35.8 35.5 34.6 38 32.7C38.7 26.2 37 20.6 33.8 15.6ZM18.1 29.3C16.6 29.3 15.4 27.9 15.4 26.2C15.4 24.5 16.6 23.1 18.1 23.1C19.6 23.1 20.8 24.5 20.8 26.2C20.8 27.9 19.6 29.3 18.1 29.3ZM28.2 29.3C26.7 29.3 25.5 27.9 25.5 26.2C25.5 24.5 26.7 23.1 28.2 23.1C29.7 23.1 30.9 24.5 30.9 26.2C30.9 27.9 29.7 29.3 28.2 29.3Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "WHATSAPP":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <rect width="48" height="48" rx="12" fill="#25D366" />
          <path
            d="M24 10C16.3 10 10 16.3 10 24C10 26.7 10.8 29.3 12.3 31.5L10.5 38L17.2 36.3C19.3 37.4 21.6 38 24 38C31.7 38 38 31.7 38 24C38 16.3 31.7 10 24 10ZM31.4 29.6C31.1 30.5 29.8 31.3 28.8 31.5C28.1 31.6 27.2 31.7 24 30.4C19.9 28.7 17.3 24.5 17.1 24.2C16.9 24 15.5 22.1 15.5 20.2C15.5 18.3 16.5 17.4 16.8 17C17.1 16.6 17.6 16.5 18 16.5C18.1 16.5 18.3 16.5 18.4 16.5C18.8 16.5 19 16.5 19.3 17.2C19.6 18 20.4 20 20.5 20.2C20.6 20.4 20.6 20.7 20.5 20.9C20.4 21.1 20.3 21.2 20.1 21.4C19.9 21.6 19.8 21.8 19.6 22C19.4 22.2 19.2 22.4 19.4 22.8C19.6 23.2 20.3 24.4 21.5 25.4C23 26.8 24.3 27.2 24.7 27.4C25 27.5 25.3 27.5 25.5 27.3C25.8 26.9 26.3 26.3 26.6 25.8C26.9 25.4 27.2 25.5 27.6 25.6C27.9 25.8 30.1 26.9 30.5 27.1C30.9 27.3 31.2 27.5 31.3 27.6C31.4 27.8 31.4 28.7 31.4 29.6Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "MERCADO_LIVRE":
    case "MERCADOLIVRE":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <rect width="48" height="48" rx="12" fill="#FFE600" />
          <path
            d="M32.8 19.2C31.7 17.9 29.9 17.2 28 17.2C26.5 17.2 25.1 17.7 24 18.7C22.9 17.7 21.5 17.2 20 17.2C18.1 17.2 16.3 17.9 15.2 19.2C14.4 20.1 14 21.3 14 22.6C14 24.1 14.6 25.4 15.7 26.3L22.5 32.5C22.9 32.9 23.4 33.1 24 33.1C24.6 33.1 25.1 32.9 25.5 32.5L32.3 26.3C33.4 25.4 34 24.1 34 22.6C34 21.3 33.6 20.1 32.8 19.2ZM24 29.6L18.2 24.3C17.7 23.8 17.4 23.2 17.4 22.6C17.4 21.4 18.5 20.4 20 20.4C21 20.4 21.9 20.9 22.4 21.7L24 23.8L25.6 21.7C26.1 20.9 27 20.4 28 20.4C29.5 20.4 30.6 21.4 30.6 22.6C30.6 23.2 30.3 23.8 29.8 24.3L24 29.6Z"
            fill="#2D3277"
          />
          <path
            d="M21.5 24.8L24 27.5L26.5 24.8C26.8 24.4 27.4 24.3 27.8 24.6C28.2 24.9 28.3 25.5 28 25.9L24.8 29.4C24.4 29.8 23.6 29.8 23.2 29.4L20 25.9C19.7 25.5 19.8 24.9 20.2 24.6C20.6 24.3 21.2 24.4 21.5 24.8Z"
            fill="#2D3277"
          />
        </svg>
      );

    case "SHOPEE":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <rect width="48" height="48" rx="12" fill="#EE4D2D" />
          <path
            d="M33 19.5H29.8C29.4 15.7 27.2 13 24 13C20.8 13 18.6 15.7 18.2 19.5H15C13.9 19.5 13 20.4 13 21.5L14.6 35C14.7 36.1 15.6 36.9 16.7 36.9H31.3C32.4 36.9 33.3 36.1 33.4 35L35 21.5C35 20.4 34.1 19.5 33 19.5ZM24 15C26 15 27.7 17 28 19.5H20C20.3 17 22 15 24 15ZM26.8 28.7C26.3 29 25.6 29.2 24.8 29.2C23.4 29.2 22.6 28.6 22.6 27.7C22.6 26.8 23.3 26.4 24.6 26L25.3 25.8C27 25.3 28 24.4 28 22.9C28 20.9 26.3 19.6 23.9 19.6C22.5 19.6 21.3 20 20.5 20.6L21.1 22.1C21.7 21.7 22.6 21.3 23.6 21.3C25 21.3 25.7 21.9 25.7 22.7C25.7 23.5 25.1 23.9 23.9 24.3L23.1 24.6C21.3 25.1 20.3 26 20.3 27.6C20.3 29.7 22 31 24.6 31C26.1 31 27.4 30.6 28.2 30L27.6 28.5L26.8 28.7Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "AMAZON":
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
        >
          <rect width="48" height="48" rx="12" fill="#131921" />
          <path
            d="M14 23.2C14 20.3 15.9 18.8 19 18.8C20.9 18.8 22.2 19.2 23 19.8V18.5C23 16.9 21.9 16.1 20.1 16.1C18.8 16.1 17.5 16.5 16.7 17L16 15.2C17.2 14.5 18.7 14.1 20.6 14.1C23.7 14.1 25.5 15.6 25.5 18.8V27.2H23.1V25.7C22.3 26.7 20.9 27.4 19.2 27.4C16.1 27.4 14 25.5 14 23.2ZM23 22.8V21.8C22.3 21.3 21.3 21 20.1 21C18.3 21 17.2 21.8 17.2 23.2C17.2 24.6 18.3 25.3 19.7 25.3C21.7 25.3 23 24.1 23 22.8Z"
            fill="#FFFFFF"
          />
          <path
            d="M12.5 30.5C17.2 33.8 23.5 34.6 29.1 32.2C29.9 31.9 30.6 32.5 30.1 33.2C23.9 38.2 15.2 36.8 10.4 32.4C9.9 31.9 10.4 31 11.1 31.2C12.4 31.6 12.5 30.5 12.5 30.5Z"
            fill="#FF9900"
          />
          <path
            d="M30.6 30.8C31.4 31.7 33 32.2 34 32.1C34.4 32.1 34.6 32.5 34.3 32.8C33.4 33.6 31.8 34.4 30.3 34C29.9 33.9 29.9 33.4 30.2 33.2C30.9 32.7 30.5 31.1 30.6 30.8Z"
            fill="#FF9900"
          />
        </svg>
      );

    default:
      return (
        <div className={`${sizeClasses} ${className} rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs`}>
          {provider ? provider.slice(0, 2).toUpperCase() : "??"}
        </div>
      );
  }
}
