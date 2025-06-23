"use client"

import { useState, useEffect, useCallback } from "react"

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

interface Note {
  id: string
  path: string
  content: string
  files: FileItem[]
  createdAt: string
  updatedAt: string
}

export function useNote(path: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchNote = useCallback(
    async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/notes/${path}`)
        if (response.ok) {
          const data = await response.json()
          setNote(data)
        } else if (response.status === 404) {
          // Note doesn't exist yet, create empty one
          setNote({
            id: "",
            path,
            content: "",
            files: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("Error fetching note:", error)
      } finally {
        setLoading(false)
      }
    },
    [path],
  )

  const updateNote = useCallback(
    async (content: string) => {
      if (!note) return

      try {
        setSaving(true)
        const response = await fetch(`/api/notes/${path}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        })

        if (response.ok) {
          const updatedNote = await response.json()
          setNote(updatedNote)
        }
      } catch (error) {
        console.error("Error updating note:", error)
      } finally {
        setSaving(false)
      }
    },
    [path, note],
  )

  // Refresh function for after file uploads/deletions
  const refreshNote = useCallback(() => {
    fetchNote()
  }, [fetchNote])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  return { 
    note, 
    loading, 
    saving, 
    updateNote, 
    refreshNote 
  }
}
