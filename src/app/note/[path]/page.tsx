"use client";

import { NoteEditor } from "@/components/note-editor";
import { useRealtimeNote } from "@/hooks/use-realtime-note";
import { use } from "react";

interface NotePageProps {
  params: Promise<{ path: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function NotePage({ params }: NotePageProps) {
  // Use React's `use` hook to unwrap the Promise
  const { path } = use(params);

  const notePath = path || "index";

  const {
    // socket,
    // connectedUsers,
    // isConnected,
    // userId,
    broadcastUpdate,
    saveToDatabase,
    refreshNote, // Add this
    note,
    loading,
    saving,
  } = useRealtimeNote(notePath);

  return (
    <div className="min-h-screen bg-background">
      {/* Connection Status Indicator */}
      {/* <div className="fixed top-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
          {connectedUsers.length > 0 && (
            <span className="ml-1">
              ({connectedUsers.length} user
              {connectedUsers.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>
      </div> */}

      <NoteEditor
        path={path}
        note={note}
        loading={loading}
        saving={saving}
        broadcastUpdate={broadcastUpdate}
        saveToDatabase={saveToDatabase}
        refreshNote={refreshNote} // Add this
      />
    </div>
  );
}
