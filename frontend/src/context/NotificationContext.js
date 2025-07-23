import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaFileAlt, FaUserAlt } from 'react-icons/fa';
import api from "../api/axiosInstance";
import { io } from 'socket.io-client';




const NotificationContext = createContext();



// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

const fetchNotifications = useCallback(async (userId) => {
  if (!userId) return Promise.resolve([]);
  
  setLoading(true);
  try {
    console.log(`Fetching notifications for user: ${userId}`);
    const response = await api.get(`/notifications/user/${userId}`);
    console.log('Fetched notifications:', response.data);
    setNotifications(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  } finally {
    setLoading(false);
  }
}, []);



  const markAsRead = useCallback(async (id) => {
  
  
  try {
    await api.put(`/notifications/${id}/read`, {}
  );
    
    // Update local state
    setNotifications(prev => {
      return prev.map(notification =>
        notification._id === id
          ? { ...notification, read: true }
          : notification
      );
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}, []);



  const markAllAsRead = useCallback(async (userId) => {
  if (!userId) return;
  
 ;
  
  try {
    await api.put(`/notifications/user/${userId}/read-all`, {}
  );
    
    // Update local state
    setNotifications(prev => {
      return prev.map(notification => ({ ...notification, read: true }));
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}, []);


  const addNotification = useCallback(async (message, type = 'info', icon = null, userId = null) => {
  if (!userId) {
    console.error('User ID is required to add a notification');
    return null;
  }

  // const token = getAuthToken();
  // if (!token) return null;

  try {
    const response = await api.post('/notifications', {
      message,
      type,
      userId
    }
  );
    
    const newNotification = response.data;
    
    // Update local state
    setNotifications(prev => [newNotification, ...prev]);
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
}, []);



const addLeaveRequestNotification = useCallback(async (employeeName, status, userId) => {
  if (!userId) {
    console.error('User ID is required to add a leave request notification');
    return null;
  }

  // Enhanced logging
  console.log("Adding leave notification with params:", {
    employeeName, 
    status, 
    userId,
    currentNotifications: notifications.length
  });

  const statusText = status === "approved" ? "approved" : "rejected";
  const message = `Your leave request has been ${statusText}`;
  
  try {
    const response = await api.post('/notifications', {
      message,
      type: 'leave', // Keep this as 'leave'
      status,
      userId
    });
    
    const newNotification = response.data;
    console.log("Created new leave notification:", newNotification);
    
    // Update local state
    setNotifications(prev => {
      const updatedNotifications = [newNotification, ...prev];
      console.log("Updated notifications with leave notification:", updatedNotifications);
      return updatedNotifications;
    });
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding leave notification:', error);
    return null;
  }
}, [notifications.length]); // Include notifications.length in dependency array


  const addResignationNotification = useCallback(async (employeeName, status, userId = null) => {
  if (!userId) {
    console.error('User ID is required to add a resignation notification');
    return null;
  }

  // // Get authentication token
  // const token = getAuthToken();
  // if (!token) return null;

  // Enhanced logging
  console.log("Adding resignation notification with params:", {
    employeeName, 
    status, 
    userId,
    currentNotifications: notifications.length
  });

  const statusText = status === "approved" ? "approved" : "rejected";
  const message = `Your resignation request has been ${statusText}`;
  
  try {
    const response = await api.post('/notifications', {
      message,
      type: 'leave',
      status,
      userId
    }
  );
    
    const newNotification = response.data;
    console.log("Created new resignation notification:", newNotification);
    
    // Update local state
    setNotifications(prev => {
      const updatedNotifications = [newNotification, ...prev];
      console.log("Updated notifications with resignation notification:", updatedNotifications);
      return updatedNotifications;
    });
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding resignation notification:', error);
    return null;
  }
}, [notifications.length]);


  const addTimeOffNotification = useCallback(async (date, status, userId) => {
  try {
    if (!userId) {
      console.error("Cannot send notification: No user ID provided");
      return;
    }

    // // Get authentication token
    // const token = getAuthToken();
    // if (!token) return null;

    const message = `Your time off request for ${new Date(date).toLocaleDateString()} has been ${status}`;
    
    // Create notification in database
    const response = await api.post('/notifications', {
      message,
      type: 'timesheet',
      status,
      userId
    }
  );
    
    console.log("Time off notification created:", response.data);
    
    // Add to local state
    setNotifications(prev => [response.data, ...prev]);
    
    return response.data;
  } catch (error) {
    console.error("Error creating time off notification:", error);
    return null;
  }
}, []);




const addShiftRequestNotification = useCallback(async (employeeName, status, requestedShift, startDate, endDate, userId = null) => {
  if (!userId) {
    console.error('User ID is required to add a shift request notification');
    return null;
  }

  // Create a more descriptive message
  let statusText = status.toLowerCase();
  if (statusText === "approved" || statusText === "rejected") {
    statusText = statusText;
  } else {
    statusText = status === "Approved" ? "approved" : "rejected";
  }
  
  const message = `Your shift request for ${requestedShift} ${startDate && endDate ? 
    `from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
    ''} has been ${statusText}`;
  
  try {
    console.log(`Creating shift notification for user ${userId}: ${message}`);
    
    const response = await api.post('/notifications', {
      message,
      type: 'shift',
      status: statusText,
      userId
    });
    
    const newNotification = response.data;
    console.log("Created new shift notification:", newNotification);
    
    // Update local state
    setNotifications(prev => {
      const updatedNotifications = [newNotification, ...prev];
      console.log("Updated notifications with shift notification:", updatedNotifications);
      return updatedNotifications;
    });
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding shift request notification:', error);
    return null;
  }
}, []);





const addWorkTypeRequestNotification = useCallback(async (employeeName, status, requestedWorktype, startDate, endDate, userId = null) => {
  if (!userId) {
    console.error('User ID is required to add a work type request notification');
    return null;
  }

  // Normalize status text
  const statusText = status.toLowerCase();
  
  // Create a descriptive message
  const message = `Your ${requestedWorktype} request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been ${statusText}`;
  
  try {
    console.log(`Creating work type notification for user ${userId}: ${message}`);
    
    const response = await api.post('/notifications', {
      message,
      type: 'worktype',
      status: statusText,
      userId
    });
    
    const newNotification = response.data;
    console.log("Created new work type notification:", newNotification);
    
    // Update local state
    setNotifications(prev => {
      const updatedNotifications = [newNotification, ...prev];
      console.log("Updated notifications with work type notification:", updatedNotifications);
      return updatedNotifications;
    });
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding work type request notification:', error);
    return null;
  }
}, []);


const addRotatingWorktypeNotification = useCallback(async (employeeName, status, requestedWorktype, startDate, endDate, userId = null) => {
  if (!userId) {
    console.error('User ID is required to add a rotating worktype notification');
    return null;
  }

  // // Get authentication token
  // const token = getAuthToken();
  // if (!token) return null;

  const statusText = status === "Approved" ? "approved" : "rejected";
  const message = `Your ${requestedWorktype} worktype request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been ${statusText}`;
  
  try {
    const response = await api.post('/notifications', {
      message,
      type: 'rotating-worktype',
      status: status.toLowerCase(),
      userId
    }
  );
    
    const newNotification = response.data;
    
    // Update local state
    setNotifications(prev => [newNotification, ...prev]);
    
    return newNotification._id;
  } catch (error) {
    console.error('Error adding rotating worktype notification:', error);
    return null;
  }
}, []);





  const deleteNotification = useCallback(async (id) => {
  // const token = getAuthToken();
  // if (!token) return;
  
  try {
    await api.delete(`/notifications/${id}`
  );
    
    // Update local state
    setNotifications(prev => {
      return prev.filter(notification => notification._id !== id);
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}, []);

  const clearAll = useCallback(async (userId) => {
  if (!userId) return;
  
  // const token = getAuthToken();
  // if (!token) return;
  
  try {
    await api.delete(`/notifications/user/${userId}/clear-all`
  );
    
    // Update local state
    setNotifications([]);
  } catch (error) {
    console.error('Error clearing all notifications:', error);
  }
}, []);

  // Function to get notifications for a specific user
  const getUserNotifications = useCallback((userId) => {
    if (!userId) return [];
    
    return notifications.filter(notification => 
      notification.userId === userId
    );
  }, [notifications]);

  // Function to get unread count for a specific user
  const getUserUnreadCount = useCallback((userId) => {
    if (!userId) return 0;
    
    return notifications.filter(notification => 
      notification.userId === userId && !notification.read
    ).length;
  }, [notifications]);

  // Set up polling for new notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Fetch notifications immediately when the user logs in
    fetchNotifications(userId);
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications(userId);
    }, 30000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Set up WebSocket connection for real-time notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.log('📡 No userId found, skipping Socket.IO setup');
      return;
    }

    console.log('📡 Setting up Socket.IO connection for user:', userId);

    // Determine the correct Socket.IO URL
    const getSocketUrl = () => {
      // For production (EC2/ALB), use current domain so nginx can proxy
      if (process.env.NODE_ENV === 'production') {
        return window.location.origin;
      }
      // For development, use the environment variable or localhost
      return process.env.REACT_APP_API_BASE_URL || 
             process.env.REACT_APP_API_URL || 
             'http://localhost:5002';
    };

    const baseURL = getSocketUrl();
    console.log('📡 Connecting to Socket.IO at:', baseURL);

    const socket = io(baseURL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      auth: {
        userId: userId
      }
    });
    
    // Handle connection events for debugging
    socket.on('connect', () => {
      console.log('📡 Socket.IO connected successfully, ID:', socket.id);
      
      // Join a room specific to this user
      socket.emit('join', userId);
      console.log('📡 Emitted join event for user:', userId);
    });

    // Listen for join confirmation
    socket.on('joined', (data) => {
      console.log('📡 Successfully joined notification room:', data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('📡 Socket.IO connection error:', error);
      console.error('📡 Error details:', {
        message: error.message,
        type: error.type,
        description: error.description
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('📡 Socket.IO disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, manual reconnection needed
        console.log('📡 Server disconnected, attempting manual reconnection...');
        socket.connect();
      }
    });

    socket.on('error', (error) => {
      console.error('📡 Socket.IO error event:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('📡 Socket.IO reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('📡 Socket.IO reconnection error:', error);
    });
    
    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      console.log('📡 Received new notification via socket:', notification);
      
      // Add the notification to our state
      setNotifications(prev => {
        // Check if we already have this notification (by ID)
        const exists = prev.some(n => n._id === notification._id);
        if (exists) {
          console.log('📡 Notification already exists, skipping');
          return prev;
        }
        console.log('📡 Adding new notification to state');
        return [notification, ...prev];
      });
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    socket.on('pong', () => {
      console.log('📡 Received pong from server');
    });
    
    // Clean up on unmount
    return () => {
      console.log('📡 Cleaning up Socket.IO connection');
      clearInterval(heartbeat);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);




const sendRotatingShiftNotification = async (userId, message, status, relatedId) => {
  try {
    // const token = getAuthToken();
    // if (!token) return null;

    // const response = await api.post(
    //   `${API_URL}/notifications`,
    const response = await api.post(
      'notifications',
      {
        userId,
        message,
        type: 'rotating-shift',
        status,
        relatedId,
        read: false,
        time: new Date()
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error sending rotating shift notification:", error);
    throw error;
  }
};




const markRotatingShiftNotificationAsRead = async (notificationId) => {
  try {
    // const token = getAuthToken();
    // if (!token) return;

    // const response = await api.put(
    //   `${API_URL}/notifications/${notificationId}/read`,
    const response = await api.put(
  `notifications/${notificationId}/read`,
      {}
    );
    
    if (response.status === 200) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  } catch (error) {
    console.error("Error marking rotating shift notification as read:", error);
  }
};





  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      loading,
      fetchNotifications,
      unreadCount,
      getUserUnreadCount,
      addNotification,
      addLeaveRequestNotification,
      addResignationNotification,
      addTimeOffNotification,
      addShiftRequestNotification,
      addWorkTypeRequestNotification,
      markRotatingShiftNotificationAsRead,
      sendRotatingShiftNotification,
      addRotatingWorktypeNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      getUserNotifications,
      
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
