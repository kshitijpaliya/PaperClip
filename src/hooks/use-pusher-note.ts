"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Pusher, { PresenceChannel } from "pusher-js";
import { toast } from "sonner";
import { encryptText, decryptText } from "@/lib/encryption";

// Add these type definitions at the top
interface PusherMember {
  id: string;
  info?: unknown;
}

interface PusherMembers {
  count: number;
  members: Record<string, PusherMember>;
}

interface FileItem {
  createdAt: string;
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  expiresAt: string;
}

interface Note {
  id: string;
  path: string;
  content: string;
  files: FileItem[];
  createdAt: string;
  updatedAt: string;
}

interface PusherNoteData {
  content: string;
  updatedAt: string;
  userId: string;
}

export function usePusherNote(path: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<PresenceChannel | null>(null);
  const lastUpdateRef = useRef<string>("");
  const userIdRef = useRef<string>("");

  // Generate unique user ID
  useEffect(() => {
    if (!userIdRef.current) {
      userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Load initial note data
  const loadNote = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${path}`);
      if (response.ok) {
        const noteData = await response.json();
        const decryptedContent = decryptText(noteData.content);
        setNote({
          ...noteData,
          content: decryptedContent,
        });
        lastUpdateRef.current = decryptedContent;
      } else if (response.status === 404) {
        // Create new note if it doesn't exist
        const newNote: Note = {
          id: "",
          path,
          content: "",
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setNote(newNote);
        lastUpdateRef.current = "";
      }
    } catch (error) {
      console.error("Failed to load note:", error);
      toast.error("Failed to load note");
    } finally {
      setLoading(false);
    }
  }, [path]);

  // Initialize Pusher connection
  useEffect(() => {
    if (!path) return;

    // Initialize Pusher
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          "X-User-ID": userIdRef.current,
        },
      },
    });

    // Subscribe to note channel
    const channelName = `presence-note-${path}`;
    channelRef.current = pusherRef.current.subscribe(
      channelName
    ) as PresenceChannel;

    // Connection events
    pusherRef.current.connection.bind("connected", () => {
      setIsConnected(true);
      console.log("Connected to Pusher");
    });

    pusherRef.current.connection.bind("disconnected", () => {
      setIsConnected(false);
      console.log("Disconnected from Pusher");
    });

    // Presence channel events
    channelRef.current.bind(
      "pusher:subscription_succeeded",
      (members: PusherMembers) => {
        setOnlineUsers(members.count);
        console.log(`${members.count} Users Online`);
      }
    );

    channelRef.current.bind("pusher:member_added", (member: PusherMember) => {
      setOnlineUsers((prev) => prev + 1);
      console.log("User Joined:", member.id);
    });

    channelRef.current.bind("pusher:member_removed", (member: PusherMember) => {
      setOnlineUsers((prev) => Math.max(0, prev - 1));
      console.log("User left:", member.id);
    });

    // Note update events
    channelRef.current.bind("note-updated", (data: PusherNoteData) => {
      // Only update if this change came from another user
      if (
        data.userId !== userIdRef.current &&
        data.content !== lastUpdateRef.current
      ) {
        setNote((prev) =>
          prev
            ? {
                ...prev,
                content: data.content,
                updatedAt: data.updatedAt,
              }
            : null
        );
        lastUpdateRef.current = data.content;
        toast.info("Note Updated By Another User");
      }
    });

    // File operation events
    channelRef.current.bind("file-uploaded", () => {
      loadNote(); // Refresh note to get new files
      toast.info("New File Uploaded");
    });

    channelRef.current.bind("file-deleted", () => {
      loadNote(); // Refresh note to update file list
      toast.info("File Deleted");
    });

    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelName);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [path, loadNote]);

  // Load note on mount
  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Broadcast update function
  const broadcastUpdate = useCallback(
    async (content: string) => {
      if (!path || content === lastUpdateRef.current) return;

      lastUpdateRef.current = content;

      try {
        await fetch("/api/pusher/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: `presence-note-${path}`,
            event: "note-updated",
            data: {
              content,
              updatedAt: new Date().toISOString(),
              userId: userIdRef.current,
            },
          }),
        });
      } catch (error) {
        console.error("Failed to broadcast update:", error);
      }
    },
    [path]
  );

  // Save to database function
  const saveToDatabase = useCallback(
    async (content: string) => {
      if (!note || saving) return;

      setSaving(true);
      try {
        const encryptedContent = encryptText(content);
        const response = await fetch(`/api/notes/${path}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: encryptedContent }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save note: ${response.status}`);
        }

        const savedNote = await response.json();
        const decryptedContent = decryptText(savedNote.content);
        setNote((prev) =>
          prev
            ? {
                ...prev,
                content: decryptedContent,
                updatedAt: savedNote.updatedAt,
                files: savedNote.files || prev.files || [],
              }
            : savedNote
        );

        lastUpdateRef.current = decryptedContent;
      } catch (error) {
        console.error("Failed to save note:", error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [note, path, saving]
  );

  // Refresh note function
  const refreshNote = useCallback(async () => {
    await loadNote();
  }, [loadNote]);

  const updateNote = async (content: string) => {
    await broadcastUpdate(content); // Real-time update
    await saveToDatabase(content); // Save to DB
  };

  // Broadcast file operation
  const broadcastFileOperation = useCallback(
    async (operation: "upload" | "delete") => {
      if (!path) return;

      try {
        await fetch("/api/pusher/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: `presence-note-${path}`,
            event: `file-${operation}d`,
            data: {
              userId: userIdRef.current,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        console.error(`Failed to broadcast file ${operation}:`, error);
      }
    },
    [path]
  );

  return {
    note,
    loading,
    saving,
    isConnected,
    onlineUsers,
    broadcastUpdate,
    saveToDatabase,
    refreshNote,
    broadcastFileOperation,
    updateNote,
  };
}
