// =============================================
// Bug Ticketing System - Main Application
// =============================================

const App = {
    // State
    currentPage: 'dashboard',
    currentBugId: null,
    currentUserId: 6, // Default QA User
    projects: [],
    developers: [],
    filters: {
        search: '',
        projectId: null,
        status: null,
        priority: null,
        developerId: null,
        page: 1,
        pageSize: 20
    },

    // =============================================
    // Initialization
    // =============================================
    init: async () => {
        console.log('🚀 Initializing Bug Ticketing System...');

        try {
            // Check API health
            const health = await Database.health();
            console.log('API Status:', health);

            if (health.status?.toLowerCase() !== 'healthy') {
                showToast('API connection issue', 'warning');
            }

            // Initialize modules
            Notifications.init();

            // Load initial data
            await Promise.all([
                App.loadProjects(),
                App.loadDevelopers()
            ]);

            // Bind events
            App.bindNavigation();
            App.bindFilters();
            App.bindCreateForm();
            App.bindModal();

            // Load dashboard
            await App.loadDashboard();

            console.log('✅ Application initialized successfully');
            showToast('Application loaded successfully', 'success');

        } catch (error) {
            console.error('❌ Initialization error:', error);
            showToast('Failed to initialize application', 'error');
        }
    },

    // =============================================
    // Navigation
    // =============================================
    bindNavigation: () => {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) App.navigateTo(page);
            });
        });

        // Quick create button
        const quickCreateBtn = document.getElementById('quick-create-btn');
        if (quickCreateBtn) {
            quickCreateBtn.addEventListener('click', () => App.navigateTo('create'));
        }
    },

    navigateTo: async (page) => {
        console.log(`📍 Navigating to: ${page}`);
        App.currentPage = page;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            tickets: 'All Tickets',
            create: 'Create Bug',
            reports: 'Reports',
            analytics: 'Analytics'
        };

        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';

        // Show/hide sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(`${page}-page`);
        if (targetSection) targetSection.classList.remove('hidden');

        // Load page data
        switch (page) {
            case 'dashboard':
                await App.loadDashboard();
                break;
            case 'tickets':
                await App.loadTickets();
                break;
            case 'analytics':
                await App.loadAnalytics();
                break;
        }
    },

    // =============================================
    // Data Loading
    // =============================================
    loadProjects: async () => {
        const response = await Database.projects.getAll();
        if (response.success) {
            App.projects = response.data;
            App.populateProjectDropdowns();
        }
    },

    populateProjectDropdowns: () => {
        const selectors = ['filter-project', 'bug-project'];

        selectors.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add projects
            App.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
        });
    },

    loadDevelopers: async () => {
        const response = await Database.developers.getAll();
        if (response.success) {
            App.developers = response.data;
            App.populateDeveloperDropdowns();
        }
    },

    populateDeveloperDropdowns: () => {
        const selectors = ['filter-developer', 'bug-developer', 'modal-developer-select'];

        selectors.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add developers
            App.developers.forEach(dev => {
                const option = document.createElement('option');
                option.value = dev.id;
                option.textContent = dev.name;
                select.appendChild(option);
            });
        });
    },

    // =============================================
    // Dashboard
    // =============================================
    loadDashboard: async () => {
        console.log('📊 Loading dashboard...');

        try {
            // Load overview
            const overviewResponse = await Database.dashboard.getOverview();
            if (overviewResponse.success) {
                App.updateDashboardStats(overviewResponse.data);
            }

            // Load stats for charts
            const statsResponse = await Database.dashboard.getStats('week');
            if (statsResponse.success) {
                App.updateDashboardCharts(statsResponse.data);
            }

            // Load recent bugs
            const recentResponse = await Database.dashboard.getRecent(5);
            if (recentResponse.success) {
                App.renderRecentBugs(recentResponse.data);
            }

            // Load critical bugs
            const criticalResponse = await Database.dashboard.getCritical();
            if (criticalResponse.success) {
                App.renderCriticalBugs(criticalResponse.data);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
            showToast('Failed to load dashboard', 'error');
        }
    },

    updateDashboardStats: (data) => {
        const setTextContent = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setTextContent('stat-total', data.totalBugs || 0);
        setTextContent('stat-open', data.openBugs || 0);
        setTextContent('stat-today', `+${data.bugsToday || 0}`);
        setTextContent('stat-resolved', data.resolvedToday || 0);
        setTextContent('stat-critical', data.byPriority?.Critical || 0);
        setTextContent('stat-overdue', data.overdueBugs || 0);
        setTextContent('stat-avg-time', `${Math.round(data.avgResolutionTimeHours || 0)}h`);

        // Update badge
        const badge = document.getElementById('open-tickets-badge');
        if (badge) badge.textContent = data.openBugs || 0;
    },

    updateDashboardCharts: (data) => {
        // Trend chart
        if (data.trend && data.trend.length > 0) {
            const trendData = {
                labels: data.trend.map(t => {
                    const date = new Date(t.date);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                }),
                opened: data.trend.map(t => t.opened),
                closed: data.trend.map(t => t.closed)
            };
            Charts.createTrendChart('trend-chart', trendData);
        }

        // Priority chart - get from overview or calculate
        if (data.byPriority) {
            Charts.createPriorityChart('priority-chart', data.byPriority);
        }
    },

    renderRecentBugs: (bugs) => {
        const container = document.getElementById('recent-bugs-list');
        if (!container) return;

        if (!bugs || bugs.length === 0) {
            container.innerHTML = '<p class="p-6 text-gray-500 text-center">No bugs found</p>';
            return;
        }

        container.innerHTML = bugs.map(bug => `
            <div class="bug-item p-4 hover:bg-gray-50 cursor-pointer border-b" onclick="App.openBugModal(${bug.id})">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-xs font-mono text-indigo-600">${App.escapeHtml(bug.ticketId)}</span>
                            <span class="priority-badge priority-${bug.priority.toLowerCase()} px-2 py-0.5 text-xs rounded-full">${bug.priority}</span>
                        </div>
                        <p class="text-sm font-medium text-gray-800 truncate">${App.escapeHtml(bug.title)}</p>
                        <p class="text-xs text-gray-500 mt-1">${App.escapeHtml(bug.projectName || '')} • ${App.formatDate(bug.createdAt)}</p>
                    </div>
                    <span class="status-badge status-${bug.status.toLowerCase()} px-2 py-1 text-xs rounded-full ml-2">${App.formatStatus(bug.status)}</span>
                </div>
            </div>
        `).join('');
    },

    renderCriticalBugs: (bugs) => {
        const container = document.getElementById('critical-bugs-list');
        const countEl = document.getElementById('critical-count');

        if (countEl) countEl.textContent = bugs?.length || 0;

        if (!container) return;

        if (!bugs || bugs.length === 0) {
            container.innerHTML = '<p class="p-6 text-gray-500 text-center">No critical bugs 🎉</p>';
            return;
        }

        container.innerHTML = bugs.slice(0, 5).map(bug => `
            <div class="bug-item p-4 hover:bg-gray-50 cursor-pointer border-b" onclick="App.openBugModal(${bug.id})">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-xs font-mono text-indigo-600">${App.escapeHtml(bug.ticketId)}</span>
                        </div>
                        <p class="text-sm font-medium text-gray-800 truncate">${App.escapeHtml(bug.title)}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            ${bug.developerName || 'Unassigned'} • 
                            ${bug.deadline ? `Due: ${App.formatDate(bug.deadline)}` : 'No deadline'}
                        </p>
                    </div>
                    <span class="status-badge status-${bug.status.toLowerCase()} px-2 py-1 text-xs rounded-full ml-2">${App.formatStatus(bug.status)}</span>
                </div>
            </div>
        `).join('');
    },

    // =============================================
    // Tickets Page
    // =============================================
    bindFilters: () => {
        const applyBtn = document.getElementById('apply-filters');
        const clearBtn = document.getElementById('clear-filters');
        const searchInput = document.getElementById('filter-search');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => App.applyFilters());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => App.clearFilters());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') App.applyFilters();
            });
        }
    },

    applyFilters: () => {
        App.filters.search = document.getElementById('filter-search')?.value || '';
        App.filters.projectId = document.getElementById('filter-project')?.value || null;
        App.filters.status = document.getElementById('filter-status')?.value || null;
        App.filters.priority = document.getElementById('filter-priority')?.value || null;
        App.filters.developerId = document.getElementById('filter-developer')?.value || null;
        App.filters.page = 1;

        App.loadTickets();
    },

    clearFilters: () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-project').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-developer').value = '';

        App.filters = {
            search: '',
            projectId: null,
            status: null,
            priority: null,
            developerId: null,
            page: 1,
            pageSize: 20
        };

        App.loadTickets();
    },

    loadTickets: async () => {
        console.log('🎫 Loading tickets...');

        const tbody = document.getElementById('tickets-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">Loading...</td></tr>';

        try {
            const response = await Database.bugs.getAll(App.filters);

            if (response.success) {
                App.renderTicketsTable(response.data);
                App.renderPagination(response.pagination);
            } else {
                throw new Error(response.error || 'Failed to load tickets');
            }

        } catch (error) {
            console.error('Error loading tickets:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-red-500">Failed to load tickets</td></tr>';
        }
    },

    renderTicketsTable: (bugs) => {
        const tbody = document.getElementById('tickets-table-body');
        if (!tbody) return;

        if (!bugs || bugs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <div class="text-gray-400">
                            <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p>No bugs found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bugs.map(bug => `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="App.openBugModal(${bug.id})">
                <td class="px-6 py-4">
                    <span class="font-mono text-sm text-indigo-600">${App.escapeHtml(bug.ticketId)}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="max-w-xs">
                        <p class="font-medium text-gray-800 truncate">${App.escapeHtml(bug.title)}</p>
                        <p class="text-sm text-gray-500">${App.escapeHtml(bug.moduleName || 'No module')}</p>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${App.escapeHtml(bug.projectName || '-')}</td>
                <td class="px-6 py-4">
                    <span class="priority-badge priority-${bug.priority.toLowerCase()} px-2 py-1 text-xs rounded-full">${bug.priority}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="status-badge status-${bug.status.toLowerCase()} px-2 py-1 text-xs rounded-full">${App.formatStatus(bug.status)}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        ${bug.developerAvatar
                ? `<img src="${App.escapeHtml(bug.developerAvatar)}" class="w-8 h-8 rounded-full" alt="">`
                : '<div class="w-8 h-8 bg-gray-200 rounded-full"></div>'
            }
                        <span class="text-sm text-gray-600">${App.escapeHtml(bug.developerName || 'Unassigned')}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                    ${bug.deadline ? App.formatDate(bug.deadline) : '-'}
                </td>
                <td class="px-6 py-4">
                    <button onclick="event.stopPropagation(); App.openBugModal(${bug.id})" 
                            class="p-1 hover:bg-gray-100 rounded" title="View">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderPagination: (pagination) => {
        if (!pagination) return;

        const { page, pageSize, total, totalPages } = pagination;

        document.getElementById('showing-from').textContent = total > 0 ? (page - 1) * pageSize + 1 : 0;
        document.getElementById('showing-to').textContent = Math.min(page * pageSize, total);
        document.getElementById('total-tickets').textContent = total;

        const container = document.getElementById('pagination-buttons');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Previous
        html += `<button class="pagination-btn px-3 py-1 border rounded ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" 
                         ${page === 1 ? 'disabled' : ''} onclick="App.goToPage(${page - 1})">Previous</button>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                html += `<button class="pagination-btn px-3 py-1 border rounded ${i === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}" 
                                 onclick="App.goToPage(${i})">${i}</button>`;
            } else if (i === page - 2 || i === page + 2) {
                html += '<span class="px-2">...</span>';
            }
        }

        // Next
        html += `<button class="pagination-btn px-3 py-1 border rounded ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" 
                         ${page === totalPages ? 'disabled' : ''} onclick="App.goToPage(${page + 1})">Next</button>`;

        container.innerHTML = html;
    },

    goToPage: (page) => {
        App.filters.page = page;
        App.loadTickets();
    },

    // =============================================
    // Create Bug Form
    // =============================================
    bindCreateForm: () => {
        const form = document.getElementById('create-bug-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await App.handleCreateBug();
        });

        const resetBtn = document.getElementById('reset-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => form.reset());
        }

        // Load modules when project changes
        const projectSelect = document.getElementById('bug-project');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                App.loadModulesForProject(e.target.value);
            });
        }
    },

    loadModulesForProject: (projectId) => {
        const moduleSelect = document.getElementById('bug-module');
        if (!moduleSelect) return;

        moduleSelect.innerHTML = '<option value="">Select Module</option>';

        if (!projectId) return;

        const project = App.projects.find(p => p.id == projectId);
        if (project && project.modules) {
            project.modules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.id;
                option.textContent = module.name;
                moduleSelect.appendChild(option);
            });
        }
    },

    handleCreateBug: async () => {
        const form = document.getElementById('create-bug-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Get form values
        const formData = {
            projectId: parseInt(document.getElementById('bug-project').value),
            moduleId: document.getElementById('bug-module').value ? parseInt(document.getElementById('bug-module').value) : null,
            title: document.getElementById('bug-title').value.trim(),
            description: document.getElementById('bug-description').value.trim(),
            stepsToReproduce: document.getElementById('bug-steps')?.value.trim() || null,
            expectedResult: document.getElementById('bug-expected')?.value.trim() || null,
            actualResult: document.getElementById('bug-actual')?.value.trim() || null,
            priority: document.getElementById('bug-priority').value,
            severity: document.getElementById('bug-severity').value,
            assignedDeveloperId: document.getElementById('bug-developer').value ? parseInt(document.getElementById('bug-developer').value) : null,
            reportedById: App.currentUserId,
            estimatedFixHours: document.getElementById('bug-estimate')?.value ? parseFloat(document.getElementById('bug-estimate').value) : null,
            deadline: document.getElementById('bug-deadline')?.value || null,
            environment: document.getElementById('bug-environment')?.value.trim() || null,
            browser: document.getElementById('bug-browser')?.value.trim() || null,
            os: document.getElementById('bug-os')?.value.trim() || null
        };

        // Validate
        if (!formData.projectId) {
            showToast('Please select a project', 'warning');
            return;
        }
        if (!formData.title) {
            showToast('Please enter a bug title', 'warning');
            return;
        }
        if (!formData.description) {
            showToast('Please enter a description', 'warning');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="animate-spin">⏳</span> Creating...';

            const response = await Database.bugs.create(formData);

            if (response.success) {
                showToast(`Bug ${response.data.ticketId} created successfully`, 'success');
                form.reset();
                App.navigateTo('tickets');
            } else {
                throw new Error(response.error || 'Failed to create bug');
            }

        } catch (error) {
            console.error('Error creating bug:', error);
            showToast(error.message || 'Failed to create bug', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Create Bug Ticket';
        }
    },

    // =============================================
    // Bug Detail Modal
    // =============================================
    bindModal: () => {
        const modal = document.getElementById('bug-detail-modal');
        const closeBtn = document.getElementById('close-modal');
        const saveBtn = document.getElementById('modal-save-changes');
        const addCommentBtn = document.getElementById('add-comment');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => App.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) App.closeModal();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => App.saveModalChanges());
        }

        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', () => App.addComment());
        }

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') App.closeModal();
        });
    },

    openBugModal: async (bugId) => {
        const modal = document.getElementById('bug-detail-modal');
        if (!modal) return;

        App.currentBugId = bugId;
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        try {
            const response = await Database.bugs.getById(bugId);

            if (response.success) {
                App.populateModal(response.data);
            } else {
                throw new Error('Bug not found');
            }

        } catch (error) {
            console.error('Error loading bug:', error);
            showToast('Failed to load bug details', 'error');
            App.closeModal();
        }
    },

    populateModal: (bug) => {
        // Header
        document.getElementById('modal-ticket-id').textContent = bug.ticketId;
        document.getElementById('modal-title').textContent = bug.title;

        // Badges
        const statusBadge = document.getElementById('modal-status');
        statusBadge.className = `status-badge status-${bug.status.toLowerCase()} px-2 py-1 text-xs rounded-full`;
        statusBadge.textContent = App.formatStatus(bug.status);

        const priorityBadge = document.getElementById('modal-priority');
        priorityBadge.className = `priority-badge priority-${bug.priority.toLowerCase()} px-2 py-1 text-xs rounded-full`;
        priorityBadge.textContent = bug.priority;

        const severityBadge = document.getElementById('modal-severity');
        severityBadge.className = `severity-badge severity-${bug.severity.toLowerCase()} px-2 py-1 text-xs rounded-full`;
        severityBadge.textContent = bug.severity;

        // Quick actions
        document.getElementById('modal-status-select').value = bug.status;
        document.getElementById('modal-developer-select').value = bug.assignedDeveloperId || '';

        // Details
        document.getElementById('modal-project').textContent = bug.projectName || '-';
        document.getElementById('modal-module').textContent = bug.moduleName || '-';
        document.getElementById('modal-developer').textContent = bug.developerName || 'Unassigned';
        document.getElementById('modal-deadline').textContent = bug.deadline ? App.formatDate(bug.deadline) : 'No deadline';
        document.getElementById('modal-created').textContent = App.formatDateTime(bug.createdAt);
        document.getElementById('modal-environment').textContent = [bug.environment, bug.browser, bug.os].filter(Boolean).join(' | ') || '-';

        // Content
        document.getElementById('modal-description').textContent = bug.description || '-';
        document.getElementById('modal-steps').textContent = bug.stepsToReproduce || 'No steps provided';
        document.getElementById('modal-expected').textContent = bug.expectedResult || '-';
        document.getElementById('modal-actual').textContent = bug.actualResult || '-';

        // Comments
        App.renderModalComments(bug.comments || []);

        // Activity
        App.renderModalActivity(bug.activity || []);
    },

    renderModalComments: (comments) => {
        const container = document.getElementById('modal-comments');
        if (!container) return;

        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No comments yet</p>';
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                <img src="${c.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.developerName)}`}" 
                     class="w-8 h-8 rounded-full" alt="">
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-sm text-gray-800">${App.escapeHtml(c.developerName)}</span>
                        <span class="text-xs text-gray-400">${App.formatDateTime(c.createdAt)}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${App.escapeHtml(c.content)}</p>
                </div>
            </div>
        `).join('');
    },

    renderModalActivity: (activity) => {
        const container = document.getElementById('modal-activity');
        if (!container) return;

        if (!activity || activity.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No activity</p>';
            return;
        }

        container.innerHTML = activity.map(a => `
            <div class="flex items-center space-x-2 text-sm py-2">
                <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span class="text-gray-700">${App.escapeHtml(a.developerName || 'System')}</span>
                <span class="text-gray-500">${App.formatActivityAction(a)}</span>
                <span class="text-gray-400 ml-auto text-xs">${App.formatDateTime(a.createdAt)}</span>
            </div>
        `).join('');
    },

    formatActivityAction: (activity) => {
        const action = activity.action;
        if (action === 'created') return 'created this bug';
        if (action === 'added_comment') return 'added a comment';
        if (action === 'updated_status') return `changed status from "${activity.oldValue}" to "${activity.newValue}"`;
        return action.replace(/_/g, ' ');
    },

    closeModal: () => {
        const modal = document.getElementById('bug-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
        App.currentBugId = null;
    },

    saveModalChanges: async () => {
        if (!App.currentBugId) return;

        const saveBtn = document.getElementById('modal-save-changes');
        const newStatus = document.getElementById('modal-status-select').value;
        const newDeveloperId = document.getElementById('modal-developer-select').value;

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            const response = await Database.bugs.update(App.currentBugId, {
                status: newStatus,
                assignedDeveloperId: newDeveloperId ? parseInt(newDeveloperId) : null,
                updatedById: App.currentUserId
            });

            if (response.success) {
                showToast('Changes saved successfully', 'success');
                await App.openBugModal(App.currentBugId);

                if (App.currentPage === 'tickets') {
                    App.loadTickets();
                } else if (App.currentPage === 'dashboard') {
                    App.loadDashboard();
                }
            } else {
                throw new Error(response.error || 'Failed to save changes');
            }

        } catch (error) {
            console.error('Error saving changes:', error);
            showToast('Failed to save changes', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    },

    addComment: async () => {
        if (!App.currentBugId) return;

        const textarea = document.getElementById('new-comment');
        const content = textarea.value.trim();

        if (!content) {
            showToast('Please enter a comment', 'warning');
            return;
        }

        try {
            const response = await Database.comments.add(App.currentBugId, App.currentUserId, content);

            if (response.success) {
                showToast('Comment added', 'success');
                textarea.value = '';
                await App.openBugModal(App.currentBugId);
            } else {
                throw new Error(response.error || 'Failed to add comment');
            }

        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Failed to add comment', 'error');
        }
    },

    // =============================================
    // Analytics
    // =============================================
    loadAnalytics: async () => {
        console.log('📈 Loading analytics...');

        try {
            const response = await Database.dashboard.getStats('month');

            if (response.success) {
                const data = response.data;

                // Status chart
                if (data.byStatus) {
                    Charts.createStatusChart('status-chart', data.byStatus);
                }

                // Project chart
                if (data.byProject) {
                    Charts.createProjectChart('project-chart', data.byProject);
                }

                // Developer chart
                if (data.byDeveloper) {
                    Charts.createDeveloperChart('developer-chart', data.byDeveloper);
                }

                // Trend chart
                if (data.trend) {
                    Charts.createTrendChart('analytics-trend-chart', data.trend);
                }
            }

        } catch (error) {
            console.error('Error loading analytics:', error);
            showToast('Failed to load analytics', 'error');
        }
    },

    // =============================================
    // Utility Functions
    // =============================================
    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatDateTime: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatStatus: (status) => {
        const statusMap = {
            'Open': 'Open',
            'InProgress': 'In Progress',
            'Fixed': 'Fixed',
            'Verified': 'Verified',
            'Closed': 'Closed',
            'Reopened': 'Reopened'
        };
        return statusMap[status] || status;
    }
};

// =============================================
// Initialize on DOM Ready
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

console.log('🐛 Bug Ticketing System - App module loaded');