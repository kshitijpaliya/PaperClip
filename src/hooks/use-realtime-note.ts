"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Note {
  content: string;
  path: string;
  updatedAt: string;
  files?: File[];
}

export function useRealtimeNote(path: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastUpdateRef = useRef<string>("");

  // Load initial note data
  const loadNote = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${path}`);
      if (response.ok) {
        const noteData = await response.json();
        setNote(noteData);
        lastUpdateRef.current = noteData.content;
        // console.log("Note loaded:", noteData);
      } else {
        // Create new note if it doesn't exist
        const newNote = {
          content: "",
          path,
          updatedAt: new Date().toISOString(),
          files: [],
        };
        setNote(newNote);
        // console.log("Created new note:", newNote);
      }
    } catch (error) {
      console.error("Failed to load note:", error);
      // Fallback to empty note
      setNote({
        content: "",
        path,
        updatedAt: new Date().toISOString(),
        files: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNote();
  }, [path]);

  // Refresh function for file operations
  const refreshNote = async () => {
    // console.log("Refreshing note data...");
    await loadNote();
  };

  // WebSocket connection
  useEffect(() => {
    // First initialize the socket server
    fetch("/api/socketio").then(() => {
      // Then connect to the socket
      const socketInstance = io("http://localhost:3001", {
        transports: ["websocket", "polling"],
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        socketInstance.emit("joinNote", { path });
        console.log("Connected to WebSocket");
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        // console.log("Disconnected from WebSocket");
      });

      socketInstance.on("noteUpdated", (data) => {
        // console.log("Note updated:", data);
        // Only update if this change came from another user
        if (data.content !== lastUpdateRef.current) {
          setNote((prev) =>
            prev
              ? {
                  ...prev,
                  content: data.content,
                  updatedAt: data.updatedAt,
                }
              : {
                  content: data.content,
                  path,
                  updatedAt: data.updatedAt,
                  files: [],
                }
          );
        }
      });
      setSocket(socketInstance);
    });
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [path]);

  // Real-time broadcast function (instant + WebSocket)
  const broadcastUpdate = (content: string) => {
    lastUpdateRef.current = content;
    // Broadcast to other users immediately via WebSocket
    if (socket && isConnected) {
      socket.emit("updateNote", {
        path,
        content,
      });
    }
  };

  // Database save function (separate from broadcast)
  const saveToDatabase = async (content: string) => {
    // console.log("saveToDatabase called with:", { content, note, path });

    if (!note) {
      // console.log("Exiting early: note is null/undefined");
      return;
    }

    setSaving(true);
    // console.log("Starting save process...");

    try {
      // console.log("Saving to database:", { content, path });

      // Save to database
      const response = await fetch(`/api/notes/${path}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      // console.log("Response received:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Save Failed:", response.status, errorText);
        throw new Error(`Failed to save note: ${response.status}`);
      }

      const savedNote = await response.json();
      // console.log("Note saved to database:", savedNote);

      // Update lastUpdateRef to prevent conflicts
      lastUpdateRef.current = savedNote.content;

      // Update the local note state with the saved data
      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: savedNote.content,
              updatedAt: savedNote.updatedAt,
              // Keep existing files if they're not in the response
              files: savedNote.files || prev.files || [],
            }
          : savedNote
      );
    } catch (error) {
      console.error("Failed to save note:", error);
      throw error; // Re-throw so the component can handle it
    } finally {
      // console.log("Setting saving to false");
      setSaving(false);
    }
  };

  return {
    socket,
    isConnected,
    broadcastUpdate,
    saveToDatabase,
    refreshNote,
    note,
    loading,
    saving,
  };
}
