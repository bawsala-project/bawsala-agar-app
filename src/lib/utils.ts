import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatSAR(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} ر.س`;
}
