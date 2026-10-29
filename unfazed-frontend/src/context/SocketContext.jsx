import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    if (!token || !user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '/';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      // connected
    });

    newSocket.on('notification', (notif) => {
      setLatestNotification(notif);
      setUnreadNotificationsCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        latestNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
