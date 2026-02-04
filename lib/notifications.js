export const notificationUtils = {
  // Request permission for push notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked. Please enable them in browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Send push notification
  async sendNotification(title, options = {}) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
      }

      const notification = new Notification(title, {
        icon: '/logos/logo-icon.png',
        badge: '/icons/badge-72x72.png',
        tag: options.tag || 'parkshift',
        requireInteraction: options.requireInteraction || false,
        ...options
      });

      // Auto close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      // Handle click event
      notification.addEventListener('click', () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notification.close();
      });

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  },

  // Format notification based on type
  formatNotification(notification) {
    const { type, title, message, data } = notification;
    
    const baseOptions = {
      body: message,
      tag: `parkshift-${type}`,
      data: data || {}
    };

    switch (type) {
      case 'booking':
        return {
          title: '🚗 ' + title,
          options: {
            ...baseOptions,
            icon: '/icons/booking-icon.png',
            requireInteraction: true,
            url: data.booking_id ? `/booking/confirmation/${data.booking_id}` : '/bookings'
          }
        };

      case 'message':
        return {
          title: '💬 ' + title,
          options: {
            ...baseOptions,
            icon: '/icons/message-icon.png',
            url: '/messages'
          }
        };

      case 'payment':
        return {
          title: '💳 ' + title,
          options: {
            ...baseOptions,
            icon: '/icons/payment-icon.png',
            requireInteraction: true,
            url: '/profile?tab=payments'
          }
        };

      case 'listing':
        return {
          title: '🏢 ' + title,
          options: {
            ...baseOptions,
            icon: '/icons/listing-icon.png',
            url: '/listings'
          }
        };

      default:
        return {
          title,
          options: baseOptions
        };
    }
  },

  // Check if notifications are supported and permitted
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }
};
