import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

let io: SocketServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('role').lean();

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = { id: decoded.id, role: user.role };
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    const userRole = socket.data.user.role;

    console.log(`User connected: ${userId} (${userRole})`);

    // Join room based on user ID for direct notifications
    socket.join(userId);

    // Join room based on role for group notifications
    socket.join(`role:${userRole}`);

    // WebRTC Signaling
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: userId, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: userId, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: userId, candidate });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};
