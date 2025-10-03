// Utility functions for date handling

// Convert date string to local date without timezone issues
function parseLocalDate(dateString) {
  if (!dateString) return null

  // If it's already a Date object, return it
  if (dateString instanceof Date) return dateString

  // Split the date string (YYYY-MM-DD)
  const parts = dateString.split("-")
  if (parts.length !== 3) return new Date(dateString)

  // Create date in local timezone (month is 0-indexed)
  return new Date(Number.parseInt(parts[0]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[2]))
}

// Format date to Brazilian format (DD/MM/YYYY)
function formatDateBR(dateString) {
  if (!dateString) return "Não definida"

  const date = parseLocalDate(dateString)
  if (!date || isNaN(date.getTime())) return "Data inválida"

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

// Get date string in YYYY-MM-DD format from Date object
function getDateString(date) {
  if (!date) return ""

  if (typeof date === "string") return date

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

// Check if date is overdue
function isOverdue(dateString) {
  if (!dateString) return false

  const date = parseLocalDate(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date < today
}

// Export functions to window
window.dateUtils = {
  parseLocalDate,
  formatDateBR,
  getDateString,
  isOverdue,
}

console.log("[v0] Date utilities loaded")
