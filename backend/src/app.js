import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { logInfo, logSuccess, logWarning } from "./utils/logger.js";
import { User } from "./modules/user/models/user.js";
import Message from "./modules/chat/models/message.js";
import { router as authRouter } from "./modules/auth/routes/index.js";
import { router as userRouter } from "./modules/user/routes/index.js";
import { router as chatRouter } from "./modules/chat/routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { injectIO } from "./middleware/socketInjection.js";

export const app = express();

const httpServer = createServer(app);

const allowedOrigins = [
  "https://bolt-iota-smoky.vercel.app",
  "http://localhost:5173",
  /\.vercel\.app$/, // allow preview deployments too
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by socket CORS"));
      }
    },
    credentials: true,
  },
});

app.use(injectIO(io)); // injects io to all routes

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(
  express.json({
    strict: true,
    verify: (req, res, buf) => {
      const raw = buf.toString();
      if (raw === "null") {
        throw new Error("Empty or invalid JSON body sent.");
      }
    },
  })
);

app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", chatRouter);

app.use(errorHandler);

app.get("/", function (res) {
  res.status(200).send(
    `<div style="width:calc(100vw-8px);height:98vh;border-radius:1rem;margin:0;display:flex;justify-content:center;align-items:center;font-size:6rem;font-family:system-ui;background-color:black;color:white;">
      <span style="text-align:center;">Welcome <br> to <br> ⚡BOLT <br> Backend Home</span></div>`
  );
});

// used to store online users
const onlineUsers = {};

export function getSocketId(userId) {
  return onlineUsers[userId];
}

io.on("connection", (socket) => {
  console.log("hello");
  
  logInfo(import.meta.url, `🔌User connected ID: ${socket.id}`);
  const userId = socket.handshake.query.userId;
  
  if (!userId) {
    socket.disconnect();
    return;
  }

  // const existingSocketId = onlineUsers[userId];
  // if (existingSocketId && existingSocketId !== socket.id) {
  //   logWarning(
  //     import.meta.url,
  //     `🟡 Duplicate socket detected for user ${userId}.`
  //   );
  // }

  if (userId) onlineUsers[userId] = socket.id;

  console.log("Online users:", onlineUsers);
  

  io.emit("users:online", Object.keys(onlineUsers));

  socket.on(
    "message:send-updateToReceiver",
    ({ senderId, receiverId, text, image }) => {
      logSuccess(import.meta.url, "message:send-updateToReceiver");
      const messagePayload = {
        senderId,
        receiverId,
        text,
        image,
        createdAt: new Date().toISOString(),
      };

      io.to(getSocketId(receiverId)).emit(
        "message:receive-updateToSender",
        messagePayload
      );
      logSuccess(import.meta.url, "message:receive-updateToSender");

      // 3. Save to database in the background (non-blocking)
      Message.create(messagePayload).catch((err) => {
        console.error("❌ Failed to save message:", err.message);
        socket.emit("error:mesage-saving", {
          message: "Failed to save message",
        });
      });
    }
  );

  socket.on("message:recived", function (res) {
    // console.log("✅ Received data:", res);
    const messageIds = res?.payload?.unSeenMessages;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      console.warn("⚠️ No unSeenMessages to update.");
      return;
    }

    setImmediate(async () => {
      try {
        const objectIds = messageIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        const result = await Message.updateMany(
          { _id: { $in: objectIds } },
          { $set: { isRead: true } }
        );

        console.log(
          "✅ Background isRead update successful:",
          result.modifiedCount
        );

        // Notify frontend only after update is done
        socket.emit("message:readed", {
          status: "success",
          updatedCount: result.modifiedCount,
          updatedIds: messageIds,
        });
      } catch (err) {
        console.error("❌ Background update failed:", err.message);

        // Optional: Notify frontend of failure
        socket.emit("message:readed", {
          status: "error",
          error: err.message,
        });
      }
    });
  });

  socket.on("disconnect", async function () {
    logInfo(import.meta.url, "🔌❌ User disconnected ID: " + socket.id);

    const userId = Object.keys(onlineUsers).find(
      (key) => onlineUsers[key] === socket.id
    );

    delete onlineUsers[userId];

    io.emit("users:online", Object.keys(onlineUsers));

    if (userId) {
      const lastSeen = new Date();

      User.findByIdAndUpdate(userId, {
        lastSeen,
      }).catch((err) => {
        console.error("❌ Failed to update user:", err.message);
      });

      // Emit immediately (non-blocking)
      io.emit("user:offline", {
        userId,
        lastSeen,
      });
    }
  });
});

export function getSocket() {
  return io;
}

export { httpServer };
