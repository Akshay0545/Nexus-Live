import { Server } from "socket.io"
import jwt from "jsonwebtoken"

let connections = {}
let messages = {}
let timeOnline = {}
const socketIdToUsername = {}
const activeScreenSharer = {} // meetingCode -> socketId

// ── Safety limits to prevent memory exhaustion ──
const MAX_CHAT_MESSAGE_LENGTH = 5000;    // max chars per chat message
const MAX_MESSAGES_PER_ROOM = 500;       // oldest messages dropped when exceeded
const MAX_SIGNAL_LENGTH = 65536;         // 64 KB max for WebRTC signaling payloads

const getSocketSecret = () => {
    const secret = process.env.JWT_SECRET
    if (!secret || String(secret).trim() === '') return null
    return secret
}

const getCorsOrigin = () => process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: getCorsOrigin(),
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        maxHttpBufferSize: 1e6 // 1 MB — reject any single socket message larger than this
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token
        if (!token) return next()
        const secret = getSocketSecret()
        if (!secret) return next()
        try {
            const decoded = jwt.verify(token, secret)
            socket.userId = decoded.id
            socket.authenticated = true
        } catch (e) {
            socket.authenticated = false
        }
        next()
    })

    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (meetingCodeOrUrl, usernameFromClient) => {
            const meetingCode = typeof meetingCodeOrUrl === 'string'
                ? meetingCodeOrUrl.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '').trim() || 'default'
                : 'default';

            if (connections[meetingCode] === undefined) {
                connections[meetingCode] = [];
            }
            if (!connections[meetingCode].includes(socket.id)) {
                connections[meetingCode].push(socket.id);
            }
            socket.meetingCode = meetingCode;
            socket.username = typeof usernameFromClient === 'string' && usernameFromClient.trim()
                ? usernameFromClient.trim()
                : 'Guest';
            socketIdToUsername[socket.id] = socket.username;
            timeOnline[socket.id] = new Date();

            for (let i = 0; i < connections[meetingCode].length; i++) {
                const targetId = connections[meetingCode][i];
                io.to(targetId).emit("user-joined", socket.id, connections[meetingCode], socket.username);
            }
            for (let i = 0; i < connections[meetingCode].length; i++) {
                const otherId = connections[meetingCode][i];
                if (otherId !== socket.id && socketIdToUsername[otherId]) {
                    io.to(socket.id).emit("participant-info", otherId, socketIdToUsername[otherId]);
                }
            }

            if (messages[meetingCode] !== undefined) {
                for (let i = 0; i < messages[meetingCode].length; i++) {
                    io.to(socket.id).emit("chat-message", messages[meetingCode][i]['data'],
                        messages[meetingCode][i]['sender'], messages[meetingCode][i]['socket-id-sender']);
                }
            }
        })

        socket.on("signal", (toId, message) => {
            // Reject oversized signaling payloads
            if (typeof message === 'string' && message.length > MAX_SIGNAL_LENGTH) return;
            io.to(toId).emit("signal", socket.id, message);
        })

        // Screen share lock: only one sharer per meeting at a time
        socket.on("screen-share-start", (cb) => {
            const meetingCode = socket.meetingCode;
            if (!meetingCode) return cb?.({ ok: false, reason: "not_in_meeting" });

            const current = activeScreenSharer[meetingCode];
            if (current && current !== socket.id) {
                return cb?.({
                    ok: false,
                    reason: "already_sharing",
                    sharerId: current,
                    sharerName: socketIdToUsername[current] || "Someone"
                });
            }

            activeScreenSharer[meetingCode] = socket.id;
            const room = connections[meetingCode] || [];
            room.forEach((sid) => io.to(sid).emit("screen-share-started", socket.id, socket.username || "Guest"));
            return cb?.({ ok: true });
        });

        socket.on("screen-share-stop", () => {
            const meetingCode = socket.meetingCode;
            if (!meetingCode) return;
            if (activeScreenSharer[meetingCode] !== socket.id) return;

            delete activeScreenSharer[meetingCode];
            const room = connections[meetingCode] || [];
            room.forEach((sid) => io.to(sid).emit("screen-share-stopped", socket.id));
        });

        socket.on("chat-message", (data, sender) => {
            // Validate message data
            if (typeof data !== 'string' || data.trim().length === 0) return;
            if (data.length > MAX_CHAT_MESSAGE_LENGTH) return;

            const matchingRoom = socket.meetingCode || Object.entries(connections)
                .find(([_, roomValue]) => roomValue.includes(socket.id))?.[0];

            if (!matchingRoom || !connections[matchingRoom]) return;

            if (!messages[matchingRoom]) {
                messages[matchingRoom] = [];
            }

            const safeSender = typeof sender === 'string' && sender.trim() ? sender.trim() : (socket.username || 'Guest');
            messages[matchingRoom].push({
                sender: safeSender,
                data: data,
                "socket-id-sender": socket.id
            });

            // Drop oldest messages if room history exceeds limit
            if (messages[matchingRoom].length > MAX_MESSAGES_PER_ROOM) {
                messages[matchingRoom] = messages[matchingRoom].slice(-MAX_MESSAGES_PER_ROOM);
            }

            connections[matchingRoom].forEach((elem) => {
                io.to(elem).emit("chat-message", data, safeSender, socket.id);
            });
        });


        socket.on("disconnect", () => {
            delete timeOnline[socket.id];
            delete socketIdToUsername[socket.id];

            const meetingCode = socket.meetingCode;
            if (!meetingCode || !connections[meetingCode]) return;

            // If the sharer disconnects, stop screen share for everyone
            if (activeScreenSharer[meetingCode] === socket.id) {
                delete activeScreenSharer[meetingCode];
                const roomBefore = connections[meetingCode] || [];
                roomBefore.forEach((sid) => io.to(sid).emit("screen-share-stopped", socket.id));
            }

            const room = connections[meetingCode];
            const idx = room.indexOf(socket.id);
            if (idx === -1) return;

            room.splice(idx, 1);
            room.forEach((sid) => io.to(sid).emit('user-left', socket.id));

            if (room.length === 0) {
                delete connections[meetingCode];
                if (messages[meetingCode] !== undefined) delete messages[meetingCode];
                if (activeScreenSharer[meetingCode] !== undefined) delete activeScreenSharer[meetingCode];
            }
        })


    })


    return io;
}

