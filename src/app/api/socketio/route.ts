import { Server } from "socket.io";
import { createServer } from "http";

export interface ServerToClientEvents {
  noteUpdated: (data: { content: string; updatedAt: string }) => void;
  cursorsUpdated: (data: { position: number }) => void;
}

export interface ClientToServerEvents {
  joinNote: (data: { path: string }) => void;
  leaveNote: (data: { path: string }) => void;
  updateNote: (data: { path: string; content: string }) => void;
  cursorMove: (data: { path: string; position: number }) => void;
}

// Add proper type for global
declare global {
  var io: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
}

export async function GET() {
  // Initialize socket server if it doesn't exist
  if (!global.io) {
    console.log("Socket is initializing");

    const httpServer = createServer();
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(
      httpServer,
      {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      }
    );

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("joinNote", ({ path }) => {
        socket.join(path);
        console.log(`Socket ${socket.id} joined note ${path}`);
      });

      socket.on("updateNote", ({ path, content }) => {
        socket.to(path).emit("noteUpdated", {
          content,
          updatedAt: new Date().toISOString(),
        });
      });

      socket.on("cursorMove", ({ path, position }) => {
        socket.to(path).emit("cursorsUpdated", { position });
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    global.io = io;

    // Start the HTTP server for Socket.IO
    const port = 3001;
    httpServer.listen(port, () => {
      console.log(`Socket.IO server running on port ${port}`);
    });
  } else {
    console.log("Socket is already running");
  }

  return Response.json({ message: "Socket initialized" });
}

export const POST = GET;
