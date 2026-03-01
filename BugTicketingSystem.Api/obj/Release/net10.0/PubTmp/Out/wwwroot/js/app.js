// Main Application Controller
const App = {
    currentPage: 'dashboard',
    currentBugId: null,
    projects: [],
    developers: [],
    bugs: [],
    filters: {
        search: '',
        project_id: '',
        status: '',
        priority: '',
        developer_id: '',
        page: 1,
        limit: 20
    },
    
    // Initialize Application
    init: async () => {
        console.log('Initializing Bug Ticketing System...');
        
        // Initialize notifications
        Notifications.init();
        
        // Load initial data
        await App.loadProjects();
        await App.loadDevelopers();
        
        // Bind events
        App.bindNavigation();
        App.bindFilters();
        App.bindCreateForm();
        App.bindModal();
        App.bindGlobalSearch();
        App.bindReports();
        
        // Load dashboard
        App.navigateTo('dashboard');
        
        // Set default dates for reports
        document.getElementById('report-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('report-week-end').value = new Date().toISOString().split('T')[0];
        document.getElementById('report-month').value = new Date().toISOString().slice(0, 7);
    },
    
    // Navigation
    bindNavigation: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                App.navigateTo(page);
            });
        });
        
        // Quick create button
        document.getElementById('quick-create-btn').addEventListener('click', () => {
            App.navigateTo('create');
        });
        
        // Sidebar toggle for mobile
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    },
    
    navigateTo: (page) => {
        App.currentPage = page;
        
        // Update nav links
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
        document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
        
        // Show/hide page sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`${page}-page`)?.classList.remove('hidden');
        
        // Load page-specific data
        switch (page) {
            case 'dashboard':
                App.loadDashboard();
                break;
            case 'tickets':
                App.loadTickets();
                break;
            case 'reports':
                App.loadDailyReport();
                break;
            case 'analytics':
                App.loadAnalytics();
                break;
        }
    },
    
    // Load Projects
    loadProjects: async () => {
        try {
            // Try API first, fallback to local
            const projects = LocalDB._getData('projects');
            App.projects = projects;
            
            // Populate project selectors
            const selectors = ['filter-project', 'bug-project'];
            selectors.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    const firstOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (firstOption) select.appendChild(firstOption);
                    
                    projects.forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = project.name;
                        select.appendChild(option);
                    });
                }
            });
            
            // Bind module loading on project change
            document.getElementById('bug-project')?.addEventListener('change', (e) => {
                App.loadModules(e.target.value);
            });
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    },
    
    loadModules: (projectId) => {
        const moduleSelect = document.getElementById('bug-module');
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
    
    // Load Developers
    loadDevelopers: async () => {
        try {
            const developers = LocalDB._getData('developers');
            App.developers = developers;
            
            // Populate developer selectors
            const selectors = ['filter-developer', 'bug-developer', 'modal-developer-select'];
            selectors.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    const firstOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (firstOption) select.appendChild(firstOption);
                    
                    developers.forEach(dev => {
                        const option = document.createElement('option');
                        option.value = dev.id;
                        option.textContent = dev.name;
                        select.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error('Error loading developers:', error);
        }
    },
    
    // Dashboard
    loadDashboard: async () => {
        try {
            const bugs = LocalDB._getData('bugs');
            App.bugs = bugs;
            
            // Calculate stats
            const today = new Date().toISOString().split('T')[0];
            const stats = {
                total: bugs.length,
                open: bugs.filter(b => ['Open', 'In Progress', 'Reopened'].includes(b.status)).length,
                today: bugs.filter(b => b.created_at.startsWith(today)).length,
                resolvedToday: bugs.filter(b => b.resolved_at && b.resolved_at.startsWith(today)).length,
                critical: bugs.filter(b => b.priority === 'Critical' && !['Closed', 'Verified'].includes(b.status)).length,
                overdue: bugs.filter(b => {
                    if (!b.deadline || ['Closed', 'Verified'].includes(b.status)) return false;
                    return new Date(b.deadline) < new Date();
                }).length
            };
            
            // Update stat cards
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-open').textContent = stats.open;
            document.getElementById('stat-today').textContent = `+${stats.today}`;
            document.getElementById('stat-resolved').textContent = stats.resolvedToday;
            document.getElementById('stat-critical').textContent = stats.critical;
            document.getElementById('stat-overdue').textContent = stats.overdue;
            
            // Update badge
            document.getElementById('open-tickets-badge').textContent = stats.open;
            
            // Calculate average resolution time
            const resolvedBugs = bugs.filter(b => b.resolved_at);
            let avgTime = 0;
            if (resolvedBugs.length > 0) {
                const totalHours = resolvedBugs.reduce((sum, b) => {
                    const created = new Date(b.created_at);
                    const resolved = new Date(b.resolved_at);
                    return sum + (resolved - created) / 3600000;
                }, 0);
                avgTime = Math.round(totalHours / resolvedBugs.length);
            }
            document.getElementById('stat-avg-time').textContent = `${avgTime}h`;
            
            // Load charts
            App.loadDashboardCharts(bugs);
            
            // Load recent bugs
            App.loadRecentBugs(bugs);
            
            // Load critical bugs
            App.loadCriticalBugs(bugs);
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },
    
    loadDashboardCharts: (bugs) => {
        // Trend chart (last 7 days)
        const trendData = { labels: [], opened: [], closed: [] };
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            trendData.labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            trendData.opened.push(bugs.filter(b => b.created_at.startsWith(dateStr)).length);
            trendData.closed.push(bugs.filter(b => b.resolved_at && b.resolved_at.startsWith(dateStr)).length);
        }
        Charts.createTrendChart('trend-chart', trendData);
        
        // Priority chart
        const priorityData = {
            Critical: bugs.filter(b => b.priority === 'Critical').length,
            High: bugs.filter(b => b.priority === 'High').length,
            Medium: bugs.filter(b => b.priority === 'Medium').length,
            Low: bugs.filter(b => b.priority === 'Low').length
        };
        Charts.createPriorityChart('priority-chart', priorityData);
    },
    
    loadRecentBugs: (bugs) => {
        const recentBugs = bugs
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
        
        const container = document.getElementById('recent-bugs-list');
        
        if (recentBugs.length === 0) {
            container.innerHTML = '<p class="p-6 text-gray-500 text-center">No bugs found</p>';
            return;
        }
        
        container.innerHTML = recentBugs.map(bug => `
            <div class="bug-item" onclick="App.openBugModal(${bug.id})">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="text-xs font-mono text-indigo-600">${bug.ticket_id}</span>
                        <span class="priority-badge priority-${bug.priority.toLowerCase()}">${bug.priority}</span>
                    </div>
                    <p class="bug-item-title">${bug.title}</p>
                    <p class="bug-item-meta">${bug.project_name} • ${App.formatDate(bug.created_at)}</p>
                </div>
                <span class="status-badge status-${bug.status.toLowerCase().replace(' ', '-')}">${bug.status}</span>
            </div>
        `).join('');
    },
    
    loadCriticalBugs: (bugs) => {
        const criticalBugs = bugs
            .filter(b => b.priority === 'Critical' && !['Closed', 'Verified'].includes(b.status))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        document.getElementById('critical-count').textContent = criticalBugs.length;
        
        const container = document.getElementById('critical-bugs-list');
        
        if (criticalBugs.length === 0) {
            container.innerHTML = '<p class="p-6 text-gray-500 text-center">No critical bugs 🎉</p>';
            return;
        }
        
        container.innerHTML = criticalBugs.slice(0, 5).map(bug => `
            <div class="bug-item" onclick="App.openBugModal(${bug.id})">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="text-xs font-mono text-indigo-600">${bug.ticket_id}</span>
                        <span class="severity-badge severity-${bug.severity.toLowerCase()}">${bug.severity}</span>
                    </div>
                    <p class="bug-item-title">${bug.title}</p>
                    <p class="bug-item-meta">
                        ${bug.developer_name || 'Unassigned'} • 
                        ${bug.deadline ? `Due: ${App.formatDate(bug.deadline)}` : 'No deadline'}
                    </p>
                </div>
                <span class="status-badge status-${bug.status.toLowerCase().replace(' ', '-')}">${bug.status}</span>
            </div>
        `).join('');
    },
    
    // Tickets Page
    bindFilters: () => {
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            App.filters.search = document.getElementById('filter-search').value;
            App.filters.project_id = document.getElementById('filter-project').value;
            App.filters.status = document.getElementById('filter-status').value;
            App.filters.priority = document.getElementById('filter-priority').value;
            App.filters.developer_id = document.getElementById('filter-developer').value;
            App.filters.page = 1;
            App.loadTickets();
        });
        
        document.getElementById('clear-filters')?.addEventListener('click', () => {
            document.getElementById('filter-search').value = '';
            document.getElementById('filter-project').value = '';
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-priority').value = '';
            document.getElementById('filter-developer').value = '';
            App.filters = { search: '', project_id: '', status: '', priority: '', developer_id: '', page: 1, limit: 20 };
            App.loadTickets();
        });
        
        // Enter key on search
        document.getElementById('filter-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('apply-filters').click();
            }
        });
    },
    
    loadTickets: () => {
        let bugs = LocalDB._getData('bugs');
        
        // Apply filters
        if (App.filters.search) {
            const search = App.filters.search.toLowerCase();
            bugs = bugs.filter(b => 
                b.title.toLowerCase().includes(search) || 
                b.ticket_id.toLowerCase().includes(search)
            );
        }
        
        if (App.filters.project_id) {
            bugs = bugs.filter(b => b.project_id == App.filters.project_id);
        }
        
        if (App.filters.status) {
            bugs = bugs.filter(b => b.status === App.filters.status);
        }
        
        if (App.filters.priority) {
            bugs = bugs.filter(b => b.priority === App.filters.priority);
        }
        
        if (App.filters.developer_id) {
            bugs = bugs.filter(b => b.assigned_developer_id == App.filters.developer_id);
        }
        
        // Sort by created date descending
        bugs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Pagination
        const total = bugs.length;
        const totalPages = Math.ceil(total / App.filters.limit);
        const start = (App.filters.page - 1) * App.filters.limit;
        const paginatedBugs = bugs.slice(start, start + App.filters.limit);
        
        // Render table
        const tbody = document.getElementById('tickets-table-body');
        
        if (paginatedBugs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                        <div class="empty-state">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p>No bugs found</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = paginatedBugs.map(bug => `
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="App.openBugModal(${bug.id})">
                    <td class="px-6 py-4">
                        <span class="font-mono text-sm text-indigo-600">${bug.ticket_id}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="max-w-xs">
                            <p class="font-medium text-gray-800 truncate">${bug.title}</p>
                            <p class="text-sm text-gray-500">${bug.module_name || 'No module'}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${bug.project_name}</td>
                    <td class="px-6 py-4">
                        <span class="priority-badge priority-${bug.priority.toLowerCase()}">${bug.priority}</span>
                    </td>
                    <td class="px-6 py-4">
                        <select class="status-select text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                                data-bug-id="${bug.id}" onchange="App.quickUpdateStatus(event, ${bug.id})">
                            <option value="Open" ${bug.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Progress" ${bug.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Fixed" ${bug.status === 'Fixed' ? 'selected' : ''}>Fixed</option>
                            <option value="Verified" ${bug.status === 'Verified' ? 'selected' : ''}>Verified</option>
                            <option value="Closed" ${bug.status === 'Closed' ? 'selected' : ''}>Closed</option>
                            <option value="Reopened" ${bug.status === 'Reopened' ? 'selected' : ''}>Reopened</option>
                        </select>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center space-x-2">
                            ${bug.developer_avatar ? 
                                `<img src="${bug.developer_avatar}" class="developer-avatar" alt="">` : 
                                '<div class="w-8 h-8 bg-gray-200 rounded-full"></div>'
                            }
                            <span class="text-sm text-gray-600">${bug.developer_name || 'Unassigned'}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm ${App.getDeadlineClass(bug.deadline, bug.status)}">
                        ${bug.deadline ? App.formatDate(bug.deadline) : '-'}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center space-x-2">
                            <button onclick="event.stopPropagation(); App.openBugModal(${bug.id})" 
                                    class="p-1 hover:bg-gray-100 rounded" title="View Details">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        // Update pagination info
        document.getElementById('showing-from').textContent = total > 0 ? start + 1 : 0;
        document.getElementById('showing-to').textContent = Math.min(start + App.filters.limit, total);
        document.getElementById('total-tickets').textContent = total;
        
        // Render pagination buttons
        App.renderPagination(totalPages);
    },
    
    renderPagination: (totalPages) => {
        const container = document.getElementById('pagination-buttons');
        container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = App.filters.page === 1;
        prevBtn.onclick = () => {
            App.filters.page--;
            App.loadTickets();
        };
        container.appendChild(prevBtn);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= App.filters.page - 1 && i <= App.filters.page + 1)) {
                const btn = document.createElement('button');
                btn.className = `pagination-btn ${i === App.filters.page ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => {
                    App.filters.page = i;
                    App.loadTickets();
                };
                container.appendChild(btn);
            } else if (i === App.filters.page - 2 || i === App.filters.page + 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-gray-500';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            }
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = App.filters.page === totalPages;
        nextBtn.onclick = () => {
            App.filters.page++;
            App.loadTickets();
        };
        container.appendChild(nextBtn);
    },
    
    quickUpdateStatus: (event, bugId) => {
        event.stopPropagation();
        const newStatus = event.target.value;
        
        const bugs = LocalDB._getData('bugs');
        const bugIndex = bugs.findIndex(b => b.id === bugId);
        
        if (bugIndex !== -1) {
            const oldStatus = bugs[bugIndex].status;
            bugs[bugIndex].status = newStatus;
            bugs[bugIndex].updated_at = new Date().toISOString();
            
            if (newStatus === 'Fixed' && oldStatus !== 'Fixed') {
                bugs[bugIndex].resolved_at = new Date().toISOString();
            }
            if (newStatus === 'Closed' && oldStatus !== 'Closed') {
                bugs[bugIndex].closed_at = new Date().toISOString();
            }
            
            LocalDB._setData('bugs', bugs);
            showToast(`Bug status updated to ${newStatus}`, 'success');
        }
    },
    
    // Create Bug Form
    bindCreateForm: () => {
        const form = document.getElementById('create-bug-form');
        
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                project_id: parseInt(document.getElementById('bug-project').value),
                module_id: document.getElementById('bug-module').value ? parseInt(document.getElementById('bug-module').value) : null,
                title: document.getElementById('bug-title').value,
                description: document.getElementById('bug-description').value,
                steps_to_reproduce: document.getElementById('bug-steps').value,
                expected_result: document.getElementById('bug-expected').value,
                actual_result: document.getElementById('bug-actual').value,
                priority: document.getElementById('bug-priority').value,
                severity: document.getElementById('bug-severity').value,
                assigned_developer_id: document.getElementById('bug-developer').value ? parseInt(document.getElementById('bug-developer').value) : null,
                estimated_fix_hours: document.getElementById('bug-estimate').value ? parseFloat(document.getElementById('bug-estimate').value) : null,
                deadline: document.getElementById('bug-deadline').value || null,
                environment: document.getElementById('bug-environment').value,
                browser: document.getElementById('bug-browser').value,
                os: document.getElementById('bug-os').value
            };
            
            // Get project and developer names
            const project = App.projects.find(p => p.id === formData.project_id);
            const developer = App.developers.find(d => d.id === formData.assigned_developer_id);
            const module = project?.modules?.find(m => m.id === formData.module_id);
            
            // Generate ticket ID
            const today = new Date();
            const ticketId = `BUG-${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
            
            // Create bug object
            const newBug = {
                ...formData,
                id: Date.now(),
                ticket_id: ticketId,
                project_name: project?.name || '',
                module_name: module?.name || '',
                developer_name: developer?.name || null,
                developer_avatar: developer?.avatar_url || null,
                reporter_name: 'QA User',
                reported_by: 1,
                status: 'Open',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                resolved_at: null,
                closed_at: null,
                comment_count: 0,
                attachment_count: 0,
                comments: [],
                attachments: [],
                activity: [
                    { action: 'created', developer_name: 'QA User', created_at: new Date().toISOString() }
                ]
            };
            
            // Save to local storage
            const bugs = LocalDB._getData('bugs');
            bugs.unshift(newBug);
            LocalDB._setData('bugs', bugs);
            
            // Show notification
            showToast(`Bug ${ticketId} created successfully`, 'success');
            
            // Add notification if assigned
            if (formData.assigned_developer_id) {
                Notifications.add({
                    type: 'assignment',
                    title: 'Bug Assigned',
                    message: `${ticketId}: ${formData.title}`
                });
            }
            
            // Reset form
            form.reset();
            
            // Navigate to tickets page
            App.navigateTo('tickets');
        });
        
        document.getElementById('reset-form')?.addEventListener('click', () => {
            document.getElementById('create-bug-form').reset();
        });
        
        // File attachment preview
        document.getElementById('bug-attachments')?.addEventListener('change', (e) => {
            const preview = document.getElementById('attachment-preview');
            preview.innerHTML = '';
            
            Array.from(e.target.files).forEach(file => {
                const item = document.createElement('div');
                item.className = 'attachment-item';
                item.innerHTML = `
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    <span>${file.name}</span>
                    <span class="text-gray-400">(${App.formatFileSize(file.size)})</span>
                `;
                preview.appendChild(item);
            });
        });
    },
    
    // Bug Detail Modal
    bindModal: () => {
        const modal = document.getElementById('bug-detail-modal');
        
        document.getElementById('close-modal')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
        
        // Save changes button
        document.getElementById('modal-save-changes')?.addEventListener('click', () => {
            App.saveModalChanges();
        });
        
        // Add comment button
        document.getElementById('add-comment')?.addEventListener('click', () => {
            App.addComment();
        });
    },
    
    openBugModal: (bugId) => {
        const bugs = LocalDB._getData('bugs');
        const bug = bugs.find(b => b.id === bugId);
        
        if (!bug) {
            showToast('Bug not found', 'error');
            return;
        }
        
        App.currentBugId = bugId;
        
        // Populate modal fields
        document.getElementById('modal-ticket-id').textContent = bug.ticket_id;
        document.getElementById('modal-title').textContent = bug.title;
        
        // Status badge
        const statusBadge = document.getElementById('modal-status');
        statusBadge.className = `status-badge status-${bug.status.toLowerCase().replace(' ', '-')}`;
        statusBadge.textContent = bug.status;
        
        // Priority badge
        const priorityBadge = document.getElementById('modal-priority');
        priorityBadge.className = `priority-badge priority-${bug.priority.toLowerCase()}`;
        priorityBadge.textContent = bug.priority;
        
        // Severity badge
        const severityBadge = document.getElementById('modal-severity');
        severityBadge.className = `severity-badge severity-${bug.severity.toLowerCase()}`;
        severityBadge.textContent = bug.severity;
        
        // Quick action selects
        document.getElementById('modal-status-select').value = bug.status;
        document.getElementById('modal-developer-select').value = bug.assigned_developer_id || '';
        
        // Details
        document.getElementById('modal-project').textContent = bug.project_name || '-';
        document.getElementById('modal-module').textContent = bug.module_name || '-';
        document.getElementById('modal-developer').textContent = bug.developer_name || 'Unassigned';
        document.getElementById('modal-deadline').textContent = bug.deadline ? App.formatDate(bug.deadline) : 'No deadline';
        document.getElementById('modal-created').textContent = App.formatDateTime(bug.created_at);
        document.getElementById('modal-environment').textContent = `${bug.environment || '-'} | ${bug.browser || '-'} | ${bug.os || '-'}`;
        
        // Description and steps
        document.getElementById('modal-description').textContent = bug.description || '-';
        document.getElementById('modal-steps').textContent = bug.steps_to_reproduce || 'No steps provided';
        document.getElementById('modal-expected').textContent = bug.expected_result || '-';
        document.getElementById('modal-actual').textContent = bug.actual_result || '-';
        
        // Comments
        App.renderComments(bug.comments || []);
        
        // Activity
        App.renderActivity(bug.activity || []);
        
        // Show modal
        document.getElementById('bug-detail-modal').classList.remove('hidden');
    },
    
    renderComments: (comments) => {
        const container = document.getElementById('modal-comments');
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No comments yet</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <img src="${comment.avatar_url || 'https://ui-avatars.com/api/?name=User'}" 
                     class="comment-avatar" alt="">
                <div class="comment-content">
                    <div class="flex items-center space-x-2">
                        <span class="comment-author">${comment.developer_name || 'User'}</span>
                        <span class="comment-time">${App.formatDateTime(comment.created_at)}</span>
                    </div>
                    <p class="comment-text">${comment.comment}</p>
                </div>
            </div>
        `).join('');
    },
    
    renderActivity: (activity) => {
        const container = document.getElementById('modal-activity');
        
        if (activity.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No activity</p>';
            return;
        }
        
        container.innerHTML = activity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span>${item.developer_name || 'System'} ${item.action}</span>
                <span class="text-gray-400 ml-auto">${App.formatDateTime(item.created_at)}</span>
            </div>
        `).join('');
    },
    
    saveModalChanges: () => {
        if (!App.currentBugId) return;
        
        const bugs = LocalDB._getData('bugs');
        const bugIndex = bugs.findIndex(b => b.id === App.currentBugId);
        
        if (bugIndex === -1) return;
        
        const newStatus = document.getElementById('modal-status-select').value;
        const newDeveloperId = document.getElementById('modal-developer-select').value;
        
        const oldStatus = bugs[bugIndex].status;
        const oldDeveloperId = bugs[bugIndex].assigned_developer_id;
        
        // Update status
        if (newStatus !== oldStatus) {
            bugs[bugIndex].status = newStatus;
            bugs[bugIndex].activity.unshift({
                action: `changed status from ${oldStatus} to ${newStatus}`,
                developer_name: 'QA User',
                created_at: new Date().toISOString()
            });
            
            if (newStatus === 'Fixed') {
                bugs[bugIndex].resolved_at = new Date().toISOString();
            }
            if (newStatus === 'Closed') {
                bugs[bugIndex].closed_at = new Date().toISOString();
            }
        }
        
        // Update developer
        if (newDeveloperId !== oldDeveloperId) {
            const newDev = App.developers.find(d => d.id == newDeveloperId);
            bugs[bugIndex].assigned_developer_id = newDeveloperId ? parseInt(newDeveloperId) : null;
            bugs[bugIndex].developer_name = newDev?.name || null;
            bugs[bugIndex].developer_avatar = newDev?.avatar_url || null;
            
            bugs[bugIndex].activity.unshift({
                action: `reassigned to ${newDev?.name || 'Unassigned'}`,
                developer_name: 'QA User',
                created_at: new Date().toISOString()
            });
            
            if (newDeveloperId) {
                Notifications.add({
                    type: 'reassignment',
                    title: 'Bug Reassigned',
                    message: `${bugs[bugIndex].ticket_id} has been assigned to you`
                });
            }
        }
        
        bugs[bugIndex].updated_at = new Date().toISOString();
        
        LocalDB._setData('bugs', bugs);
        showToast('Changes saved successfully', 'success');
        
        // Refresh the modal
        App.openBugModal(App.currentBugId);
        
        // Refresh tickets if on that page
        if (App.currentPage === 'tickets') {
            App.loadTickets();
        }
    },
    
    addComment: () => {
        if (!App.currentBugId) return;
        
        const commentText = document.getElementById('new-comment').value.trim();
        if (!commentText) {
            showToast('Please enter a comment', 'warning');
            return;
        }
        
        const bugs = LocalDB._getData('bugs');
        const bugIndex = bugs.findIndex(b => b.id === App.currentBugId);
        
        if (bugIndex === -1) return;
        
        const newComment = {
            id: Date.now(),
            developer_id: 1,
            developer_name: 'QA User',
            avatar_url: 'https://ui-avatars.com/api/?name=QA+User&background=6366f1&color=fff',
            comment: commentText,
            created_at: new Date().toISOString()
        };
        
        if (!bugs[bugIndex].comments) {
            bugs[bugIndex].comments = [];
        }
        bugs[bugIndex].comments.unshift(newComment);
        bugs[bugIndex].comment_count = bugs[bugIndex].comments.length;
        
        bugs[bugIndex].activity.unshift({
            action: 'added a comment',
            developer_name: 'QA User',
            created_at: new Date().toISOString()
        });
        
        bugs[bugIndex].updated_at = new Date().toISOString();
        
        LocalDB._setData('bugs', bugs);
        
        document.getElementById('new-comment').value = '';
        showToast('Comment added', 'success');
        
        // Refresh comments
        App.renderComments(bugs[bugIndex].comments);
        App.renderActivity(bugs[bugIndex].activity);
    },
    
    // Reports
    bindReports: () => {
        // Tab switching
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const reportType = tab.dataset.report;
                
                // Show/hide date pickers
                document.getElementById('daily-date-picker').classList.toggle('hidden', reportType !== 'daily');
                document.getElementById('weekly-date-picker').classList.toggle('hidden', reportType !== 'weekly');
                document.getElementById('monthly-date-picker').classList.toggle('hidden', reportType !== 'monthly');
                
                // Show/hide report sections
                document.querySelectorAll('.report-section').forEach(section => section.classList.add('hidden'));
                document.getElementById(`${reportType}-report`).classList.remove('hidden');
                
                // Load report
                switch (reportType) {
                    case 'daily':
                        App.loadDailyReport();
                        break;
                    case 'weekly':
                        App.loadWeeklyReport();
                        break;
                    case 'monthly':
                        App.loadMonthlyReport();
                        break;
                }
            });
        });
        
        // Generate report button
        document.getElementById('generate-report')?.addEventListener('click', () => {
            const activeTab = document.querySelector('.report-tab.active');
            const reportType = activeTab?.dataset.report || 'daily';
            
            switch (reportType) {
                case 'daily':
                    App.loadDailyReport();
                    break;
                case 'weekly':
                    App.loadWeeklyReport();
                    break;
                case 'monthly':
                    App.loadMonthlyReport();
                    break;
            }
        });
        
        // Export button
        document.getElementById('export-report')?.addEventListener('click', () => {
            showToast('Export feature coming soon!', 'info');
        });
    },
    
    loadDailyReport: () => {
        const date = document.getElementById('report-date').value || new Date().toISOString().split('T')[0];
        const bugs = LocalDB._getData('bugs');
        
        const bugsLogged = bugs.filter(b => b.created_at.startsWith(date));
        const bugsResolved = bugs.filter(b => b.resolved_at && b.resolved_at.startsWith(date));
        const criticalPending = bugs.filter(b => 
            b.priority === 'Critical' && 
            !['Closed', 'Verified'].includes(b.status)
        );
        
        // Update stats
        document.getElementById('daily-logged').textContent = bugsLogged.length;
        document.getElementById('daily-resolved').textContent = bugsResolved.length;
        document.getElementById('daily-critical').textContent = criticalPending.length;
        
        // Priority breakdown
        document.getElementById('daily-priority-critical').textContent = bugsLogged.filter(b => b.priority === 'Critical').length;
        document.getElementById('daily-priority-high').textContent = bugsLogged.filter(b => b.priority === 'High').length;
        document.getElementById('daily-priority-medium').textContent = bugsLogged.filter(b => b.priority === 'Medium').length;
        document.getElementById('daily-priority-low').textContent = bugsLogged.filter(b => b.priority === 'Low').length;
        
        // Bugs logged list
        const loggedList = document.getElementById('daily-logged-list');
        if (bugsLogged.length === 0) {
            loggedList.innerHTML = '<p class="p-4 text-gray-500 text-center">No bugs logged on this date</p>';
        } else {
            loggedList.innerHTML = bugsLogged.map(bug => `
                <div class="bug-item" onclick="App.openBugModal(${bug.id})">
                    <div class="flex-1">
                        <span class="text-xs font-mono text-indigo-600">${bug.ticket_id}</span>
                        <p class="bug-item-title">${bug.title}</p>
                    </div>
                    <span class="priority-badge priority-${bug.priority.toLowerCase()}">${bug.priority}</span>
                </div>
            `).join('');
        }
        
        // Critical bugs list
        const criticalList = document.getElementById('daily-critical-list');
        if (criticalPending.length === 0) {
            criticalList.innerHTML = '<p class="p-4 text-gray-500 text-center">No critical bugs pending 🎉</p>';
        } else {
            criticalList.innerHTML = criticalPending.map(bug => {
                const daysOpen = Math.floor((new Date() - new Date(bug.created_at)) / 86400000);
                return `
                    <div class="bug-item" onclick="App.openBugModal(${bug.id})">
                        <div class="flex-1">
                            <span class="text-xs font-mono text-indigo-600">${bug.ticket_id}</span>
                            <p class="bug-item-title">${bug.title}</p>
                            <p class="bug-item-meta text-red-600">${daysOpen} days open</p>
                        </div>
                        <span class="status-badge status-${bug.status.toLowerCase().replace(' ', '-')}">${bug.status}</span>
                    </div>
                `;
            }).join('');
        }
    },
    
    loadWeeklyReport: () => {
        const endDate = document.getElementById('report-week-end').value || new Date().toISOString().split('T')[0];
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        const bugs = LocalDB._getData('bugs');
        
        // Calculate weekly data
        const opened = bugs.filter(b => {
            const date = b.created_at.split('T')[0];
            return date >= startDateStr && date <= endDate;
        });
        
        const closed = bugs.filter(b => {
            if (!b.resolved_at) return false;
            const date = b.resolved_at.split('T')[0];
            return date >= startDateStr && date <= endDate;
        });
        
        // Update stats
        document.getElementById('weekly-opened').textContent = opened.length;
        document.getElementById('weekly-closed').textContent = closed.length;
        const netChange = opened.length - closed.length;
        const netEl = document.getElementById('weekly-net');
        netEl.textContent = (netChange > 0 ? '+' : '') + netChange;
        netEl.className = `text-3xl font-bold mt-1 ${netChange > 0 ? 'text-red-600' : netChange < 0 ? 'text-green-600' : 'text-gray-800'}`;
        
        // Average resolution time
        let avgHours = 0;
        if (closed.length > 0) {
            const totalHours = closed.reduce((sum, b) => {
                return sum + (new Date(b.resolved_at) - new Date(b.created_at)) / 3600000;
            }, 0);
            avgHours = Math.round(totalHours / closed.length);
        }
        document.getElementById('weekly-avg-time').textContent = `${avgHours}h`;
        
        // Trend chart data
        const trendData = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            trendData.push({
                date: dateStr,
                opened: bugs.filter(b => b.created_at.startsWith(dateStr)).length,
                closed: bugs.filter(b => b.resolved_at && b.resolved_at.startsWith(dateStr)).length
            });
        }
        Charts.createWeeklyTrendChart('weekly-trend-chart', trendData);
        
        // Top recurring modules
        const moduleCount = {};
        opened.forEach(bug => {
            const key = `${bug.module_name || 'Unknown'} (${bug.project_name})`;
            moduleCount[key] = (moduleCount[key] || 0) + 1;
        });
        
        const modulesList = document.getElementById('weekly-modules-list');
        const sortedModules = Object.entries(moduleCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        if (sortedModules.length === 0) {
            modulesList.innerHTML = '<p class="p-4 text-gray-500 text-center">No data available</p>';
        } else {
            modulesList.innerHTML = sortedModules.map(([name, count]) => `
                <div class="flex items-center justify-between p-4">
                    <span class="text-gray-800">${name}</span>
                    <span class="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">${count} bugs</span>
                </div>
            `).join('');
        }
        
        // Developer performance
        const devPerformance = {};
        App.developers.forEach(dev => {
            devPerformance[dev.name] = {
                resolved: closed.filter(b => b.assigned_developer_id === dev.id).length,
                pending: bugs.filter(b => 
                    b.assigned_developer_id === dev.id && 
                    !['Closed', 'Verified'].includes(b.status)
                ).length
            };
        });
        
        const devList = document.getElementById('weekly-developer-list');
        const sortedDevs = Object.entries(devPerformance).sort((a, b) => b[1].resolved - a[1].resolved);
        
        devList.innerHTML = sortedDevs.map(([name, stats]) => `
            <div class="flex items-center justify-between p-4">
                <span class="text-gray-800">${name}</span>
                <div class="flex items-center space-x-4">
                    <span class="text-green-600">${stats.resolved} resolved</span>
                    <span class="text-yellow-600">${stats.pending} pending</span>
                </div>
            </div>
        `).join('');
    },
    
    loadMonthlyReport: () => {
        const month = document.getElementById('report-month').value || new Date().toISOString().slice(0, 7);
        const bugs = LocalDB._getData('bugs');
        
        // Filter bugs for the month
        const monthBugs = bugs.filter(b => b.created_at.startsWith(month));
        
        // Release readiness calculation
        const openBugs = bugs.filter(b => !['Closed', 'Verified'].includes(b.status)).length;
        const closedBugs = bugs.filter(b => ['Closed', 'Verified'].includes(b.status)).length;
        const criticalOpen = bugs.filter(b => b.priority === 'Critical' && !['Closed', 'Verified'].includes(b.status)).length;
        
        const totalBugs = openBugs + closedBugs;
        let readinessScore = totalBugs > 0 
            ? Math.round((closedBugs / totalBugs) * 100 - (criticalOpen * 5))
            : 100;
        readinessScore = Math.max(0, Math.min(100, readinessScore));
        
        document.getElementById('readiness-score').textContent = `${readinessScore}%`;
        const readinessBar = document.getElementById('readiness-bar');
        readinessBar.style.width = `${readinessScore}%`;
        readinessBar.className = `h-4 rounded-full transition-all duration-500 ${
            readinessScore >= 80 ? 'bg-green-600' : 
            readinessScore >= 60 ? 'bg-yellow-500' : 'bg-red-600'
        }`;
        
        document.getElementById('monthly-open').textContent = openBugs;
        document.getElementById('monthly-closed').textContent = closedBugs;
        document.getElementById('monthly-critical').textContent = criticalOpen;
        
        // Defect density by project
        const projectStats = App.projects.map(project => {
            const projectBugs = monthBugs.filter(b => b.project_id === project.id);
            return {
                project_name: project.name,
                total_bugs: projectBugs.length,
                critical: projectBugs.filter(b => b.priority === 'Critical').length,
                resolved: projectBugs.filter(b => ['Closed', 'Verified'].includes(b.status)).length
            };
        });
        
        Charts.createDefectDensityChart('defect-density-chart', projectStats);
        
        // Developer performance
        const devContainer = document.getElementById('monthly-developer-performance');
        const devStats = App.developers.map(dev => {
            const devBugs = bugs.filter(b => b.assigned_developer_id === dev.id);
            const resolved = devBugs.filter(b => 
                b.resolved_at && b.resolved_at.startsWith(month)
            ).length;
            
            let avgHours = 0;
            const resolvedBugs = devBugs.filter(b => b.resolved_at);
            if (resolvedBugs.length > 0) {
                avgHours = resolvedBugs.reduce((sum, b) => {
                    return sum + (new Date(b.resolved_at) - new Date(b.created_at)) / 3600000;
                }, 0) / resolvedBugs.length;
            }
            
            return {
                name: dev.name,
                avatar: dev.avatar_url,
                resolved,
                avgHours: Math.round(avgHours)
            };
        }).sort((a, b) => b.resolved - a.resolved);
        
        const maxResolved = Math.max(...devStats.map(d => d.resolved), 1);
        
        devContainer.innerHTML = devStats.map(dev => `
            <div class="flex items-center space-x-4">
                <img src="${dev.avatar}" class="w-10 h-10 rounded-full" alt="${dev.name}">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-gray-800">${dev.name}</span>
                        <span class="text-sm text-gray-500">${dev.resolved} bugs | Avg: ${dev.avgHours}h</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill bg-indigo-600" style="width: ${(dev.resolved / maxResolved) * 100}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // Analytics
    loadAnalytics: () => {
        const bugs = LocalDB._getData('bugs');
        
        // Status chart
        const statusData = {};
        bugs.forEach(bug => {
            statusData[bug.status] = (statusData[bug.status] || 0) + 1;
        });
        Charts.createStatusChart('status-chart', statusData);
        
        // Project chart
        const projectData = App.projects.map(p => ({
            name: p.name,
            count: bugs.filter(b => b.project_id === p.id).length
        }));
        Charts.createProjectChart('project-chart', projectData);
        
        // Developer chart
        const developerData = App.developers.map(d => ({
            name: d.name,
            open_bugs: bugs.filter(b => 
                b.assigned_developer_id === d.id && 
                !['Closed', 'Verified'].includes(b.status)
            ).length,
            closed_bugs: bugs.filter(b => 
                b.assigned_developer_id === d.id && 
                ['Closed', 'Verified'].includes(b.status)
            ).length
        }));
        Charts.createDeveloperChart('developer-chart', developerData);
        
        // Trend chart
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            trendData.push({
                date: dateStr,
                opened: bugs.filter(b => b.created_at.startsWith(dateStr)).length,
                closed: bugs.filter(b => b.resolved_at && b.resolved_at.startsWith(dateStr)).length
            });
        }
        Charts.createWeeklyTrendChart('analytics-trend-chart', trendData);
    },
    
    // Global Search
    bindGlobalSearch: () => {
        const searchInput = document.getElementById('global-search');
        let searchTimeout;
        
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    App.filters.search = query;
                    App.navigateTo('tickets');
                    document.getElementById('filter-search').value = query;
                    App.loadTickets();
                }
            }, 300);
        });
    },
    
    // Utility Functions
    formatDate: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
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
    
    formatFileSize: (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / 1048576) + ' MB';
    },
    
    getDeadlineClass: (deadline, status) => {
        if (!deadline || ['Closed', 'Verified'].includes(status)) return 'text-gray-600';
        
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadlineDate - today) / 86400000);
        
        if (diffDays < 0) return 'deadline-warning';
        if (diffDays <= 2) return 'deadline-soon';
        return 'text-gray-600';
    }
};

// Initialize app when DOM is ready
$(document).ready(() => {
    App.init();
});