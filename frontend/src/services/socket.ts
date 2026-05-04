import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('appointment-created', (data) => {
    toast.info(data.message || 'New appointment created');
  });

  socket.on('appointment-updated', (data) => {
    toast.success(data.message || 'Appointment status updated');
  });

  socket.on('prescription-issued', (data) => {
    toast.success(data.message || 'New prescription issued');
  });

  socket.on('webrtc-offer', ({ from, offer }) => {
    toast.info(`Incoming video call...`, {
      action: {
        label: 'Answer',
        onClick: () => {
          // This will be handled by the TeleConsultation component
          window.dispatchEvent(new CustomEvent('incoming-call', { detail: { from, offer } }));
        },
      },
      duration: 10000,
    });
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
