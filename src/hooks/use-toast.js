import { useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = 'default' }) => {
    console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)

  }

  return { toast, toasts }
}
