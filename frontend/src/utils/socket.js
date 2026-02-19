import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
  autoConnect: false
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const onAttendanceCheckin = (callback) => {
  socket.on('attendance:checkin', callback);
};

export const onAttendanceCheckout = (callback) => {
  socket.on('attendance:checkout', callback);
};

export const onAlert = (callback) => {
  socket.on('alert', callback);
};

export default socket;
