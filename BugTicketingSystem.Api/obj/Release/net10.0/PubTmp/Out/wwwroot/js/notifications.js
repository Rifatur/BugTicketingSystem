// Notifications Handler
const Notifications = {
    container: null,
    badge: null,
    list: null,
    dropdown: null,
    notifications: [],
    
    init: () => {
        Notifications.badge = document.getElementById('notification-badge');
        Notifications.list = document.getElementById('notifications-list');
        Notifications.dropdown = document.getElementById('notifications-dropdown');
        
        // Load notifications from localStorage
        const stored = localStorage.getItem('notifications');
        if (stored) {
            Notifications.notifications = JSON.parse(stored);
        }
        
        Notifications.render();
        Notifications.bindEvents();
    },
    
    bindEvents: () => {
        const btn = document.getElementById('notifications-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Notifications.dropdown.classList.toggle('hidden');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!Notifications.dropdown.contains(e.target)) {
                Notifications.dropdown.classList.add('hidden');
            }
        });
    },
    
    add: (notification) => {
        notification.id = Date.now();
        notification.is_read = false;
        notification.created_at = new Date().toISOString();
        
        Notifications.notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (Notifications.notifications.length > 50) {
            Notifications.notifications = Notifications.notifications.slice(0, 50);
        }
        
        Notifications.save();
        Notifications.render();
        Notifications.showToast(notification);
    },
    
    markAsRead: (id) => {
        const notification = Notifications.notifications.find(n => n.id === id);
        if (notification) {
            notification.is_read = true;
            Notifications.save();
            Notifications.render();
        }
    },
    
    markAllAsRead: () => {
        Notifications.notifications.forEach(n => n.is_read = true);
        Notifications.save();
        Notifications.render();
    },
    
    save: () => {
        localStorage.setItem('notifications', JSON.stringify(Notifications.notifications));
    },
    
    render: () => {
        const unreadCount = Notifications.notifications.filter(n => !n.is_read).length;
        
        // Update badge
        if (unreadCount > 0) {
            Notifications.badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            Notifications.badge.classList.remove('hidden');
        } else {
            Notifications.badge.classList.add('hidden');
        }
        
        // Render list
        if (Notifications.notifications.length === 0) {
            Notifications.list.innerHTML = '<p class="p-4 text-gray-500 text-center">No notifications</p>';
            return;
        }
        
        Notifications.list.innerHTML = Notifications.notifications.slice(0, 10).map(n => `
            <div class="p-4 hover:bg-gray-50 cursor-pointer ${n.is_read ? 'opacity-60' : ''}" 
                 onclick="Notifications.markAsRead(${n.id})">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        ${Notifications.getIcon(n.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 ${n.is_read ? '' : 'font-semibold'}">${n.title}</p>
                        <p class="text-sm text-gray-500 truncate">${n.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${Notifications.formatTime(n.created_at)}</p>
                    </div>
                    ${!n.is_read ? '<span class="w-2 h-2 bg-indigo-600 rounded-full"></span>' : ''}
                </div>
            </div>
        `).join('');
        
        if (Notifications.notifications.some(n => !n.is_read)) {
            Notifications.list.innerHTML += `
                <div class="p-3 border-t border-gray-200 text-center">
                    <button onclick="Notifications.markAllAsRead()" class="text-sm text-indigo-600 hover:text-indigo-800">
                        Mark all as read
                    </button>
                </div>
            `;
        }
    },
        getIcon: (type) => {
        const icons = {
            assignment: `<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
            </div>`,
            status_change: `<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>`,
            comment: `<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </div>`,
            critical: `<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>`,
            default: `<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
            </div>`
        };
        return icons[type] || icons.default;
    },
    
    formatTime: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    },
    
    showToast: (notification) => {
        const toast = document.getElementById('toast');
        const message = document.getElementById('toast-message');
        const icon = document.getElementById('toast-icon');
        
        message.textContent = notification.title;
        icon.innerHTML = Notifications.getToastIcon(notification.type);
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    },
    
    getToastIcon: (type) => {
        const icons = {
            assignment: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
            status_change: '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            success: '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            error: '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            warning: '<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            info: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[type] || icons.info;
    }
};

// Toast Helper Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    messageEl.textContent = message;
    iconEl.innerHTML = Notifications.getToastIcon(type);
    
    // Update toast background based on type
    const toastDiv = toast.querySelector('div');
    toastDiv.className = 'px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3';
    
    switch(type) {
        case 'success':
            toastDiv.classList.add('bg-green-600', 'text-white');
            break;
        case 'error':
            toastDiv.classList.add('bg-red-600', 'text-white');
            break;
        case 'warning':
            toastDiv.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            toastDiv.classList.add('bg-gray-800', 'text-white');
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}