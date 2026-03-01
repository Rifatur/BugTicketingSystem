// =============================================
// Notifications Handler
// =============================================

const Notifications = {
    items: [],

    init: () => {
        console.log('🔔 Notifications module initialized');

        // Load from localStorage
        const stored = localStorage.getItem('bug_notifications');
        if (stored) {
            try {
                Notifications.items = JSON.parse(stored);
            } catch (e) {
                Notifications.items = [];
            }
        }

        Notifications.updateBadge();
    },

    add: (notification) => {
        notification.id = Date.now();
        notification.isRead = false;
        notification.createdAt = new Date().toISOString();

        Notifications.items.unshift(notification);

        // Keep only last 50
        if (Notifications.items.length > 50) {
            Notifications.items = Notifications.items.slice(0, 50);
        }

        Notifications.save();
        Notifications.updateBadge();
        Notifications.showToast(notification);
    },

    markAsRead: (id) => {
        const notification = Notifications.items.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
            Notifications.save();
            Notifications.updateBadge();
        }
    },

    markAllAsRead: () => {
        Notifications.items.forEach(n => n.isRead = true);
        Notifications.save();
        Notifications.updateBadge();
    },

    save: () => {
        localStorage.setItem('bug_notifications', JSON.stringify(Notifications.items));
    },

    updateBadge: () => {
        const unreadCount = Notifications.items.filter(n => !n.isRead).length;
        const badge = document.getElementById('notification-badge');

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    showToast: (notification) => {
        showToast(notification.title || notification.message, notification.type || 'info');
    },

    refresh: async () => {
        // Could fetch from server in future
        console.log('🔄 Refreshing notifications');
    }
};

// =============================================
// Toast Notification Function
// =============================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-y-full opacity-0`;

    // Set colors based on type
    const colors = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-gray-800 text-white'
    };

    toast.classList.add(...(colors[type] || colors.info).split(' '));

    // Set icon based on type
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

console.log('🔔 Notifications module loaded');