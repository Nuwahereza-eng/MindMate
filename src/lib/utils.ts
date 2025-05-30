import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: Date, locale?: Locale): string {
  try {
    return format(timestamp, "p", { locale }); // 'p' is short time format like 2:30 PM
  } catch (error) {
    // Fallback for invalid date or locale
    console.warn("Error formatting timestamp:", error);
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
