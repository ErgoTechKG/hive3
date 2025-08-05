import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';
import { RootState } from '../store';
import config from '../config';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  emit: () => {},
  on: () => {},
  off: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (accessToken && user) {
      // Initialize socket connection
      const newSocket = io(config.SOCKET_URL, {
        auth: {
          token: accessToken,
        },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Global event listeners
      newSocket.on('task:new', (task) => {
        enqueueSnackbar(`New task: ${task.title}`, { variant: 'info' });
      });

      newSocket.on('task:statusUpdate', ({ taskId, status }) => {
        enqueueSnackbar(`Task status updated to ${status}`, { variant: 'info' });
      });

      newSocket.on('enrollment:statusChanged', ({ courseId, status }) => {
        enqueueSnackbar(`Enrollment status changed to ${status}`, { variant: 'info' });
      });

      newSocket.on('system:notification', (notification) => {
        enqueueSnackbar(notification.message, { 
          variant: notification.type || 'info' 
        });
      });

      newSocket.on('role:notification', (notification) => {
        enqueueSnackbar(notification.message, { 
          variant: notification.type || 'info' 
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect socket if no auth
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [accessToken, user]);

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;