import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0]
}

export function startOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
