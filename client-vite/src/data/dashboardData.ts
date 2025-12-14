export interface StatItem {
    label: string;
    value: string;
    color: string;
    description?: string;
}

export interface ActionItem {
    icon: string;
    title: string;
    description: string;
    onClick?: () => void; // onClick will likely need to be attached in the component, but we can define the structure here
}

// Admin Stats
export const ADMIN_STATS: StatItem[] = [
    { label: 'Total Users', value: '156', color: '#007bff', description: 'System users' },
    { label: 'Active Sessions', value: '42', color: '#28a745', description: 'Currently online' },
    { label: 'System Health', value: '98%', color: '#20c997', description: 'Uptime status' },
    { label: 'Pending Tasks', value: '8', color: '#ffc107', description: 'Awaiting action' }
];

// Methods Stats
export const METHODS_STATS: StatItem[] = [
    { label: 'Process Reviews', value: '23', color: '#007bff', description: 'Pending reviews' },
    { label: 'Efficiency Score', value: '87%', color: '#28a745', description: 'Current rating' },
    { label: 'Optimizations', value: '15', color: '#20c997', description: 'This month' },
    { label: 'Team Members', value: '12', color: '#6f42c1', description: 'Methods team' }
];

// Default/Department Stats
export const DEPARTMENT_STATS: StatItem[] = [
    { label: 'Department Ideas', value: '47', color: '#007bff', description: 'Total ideas submitted' },
    { label: 'Pending Review', value: '12', color: '#ffc107', description: 'Awaiting approval' },
    { label: 'Approved', value: '28', color: '#28a745', description: 'Implemented ideas' },
    { label: 'Team Members', value: '15', color: '#6f42c1', description: 'Active department members' }
];

// Admin Actions
export const ADMIN_ACTIONS: ActionItem[] = [
    { icon: '👥', title: 'User Management', description: 'Manage all system users and permissions' },
    { icon: '📊', title: 'System Reports', description: 'View comprehensive system analytics' },
    { icon: '⚙️', title: 'System Settings', description: 'Configure system-wide settings' }
];

// Methods Actions
export const METHODS_ACTIONS: ActionItem[] = [
    { icon: '📋', title: 'Process Review', description: 'Review and optimize methods' },
    { icon: '📈', title: 'Efficiency Metrics', description: 'Analyze process performance' },
    { icon: '🔄', title: 'Workflow Optimization', description: 'Improve existing workflows' }
];

// Department Actions
export const DEPARTMENT_ACTIONS: ActionItem[] = [
    { icon: '📊', title: 'Department Reports', description: 'Generate department performance reports' },
    { icon: '👥', title: 'Team Management', description: 'Manage team members and roles' },
    { icon: '💡', title: 'Idea Review', description: 'Review and approve team ideas' }
];

// DashboardPage Specific Stats (Admin Ideas Dashboard)
export const ADMIN_IDEAS_STATS: StatItem[] = [
    { label: 'Total Ideas', value: '502', color: '#007bff' },
    { label: 'Uncle Review', value: '1', color: '#ffc107' },
    { label: 'Ongoing', value: '150', color: '#17a2b8' },
    { label: 'Approved', value: '121', color: '#28a745' },
    { label: 'Implemented', value: '18', color: '#6f42c1' },
    { label: 'Expected', value: '212', color: '#fd7e14' }
];

// User Dashboard Stats
export const USER_DASHBOARD_STATS: StatItem[] = [
    { label: 'My Tasks', value: '8', color: '#007bff', description: 'Assigned tasks' },
    { label: 'Completed', value: '12', color: '#28a745', description: 'Finished tasks' },
    { label: 'Pending', value: '3', color: '#ffc107', description: 'Awaiting review' },
    { label: 'Ideas Submitted', value: '5', color: '#6f42c1', description: 'Your contributions' }
];

// User Dashboard Actions
export const USER_DASHBOARD_ACTIONS: ActionItem[] = [
    { icon: '📋', title: 'My Tasks', description: 'View and manage your assigned tasks' },
    { icon: '👤', title: 'My Profile', description: 'Update your personal information' },
    { icon: '💡', title: 'Submit Idea', description: 'Share your ideas and suggestions' },
    { icon: '📊', title: 'My Reports', description: 'View your performance reports' }
];

// Methods Dashboard Specific Stats (Extended)
export const METHODS_DASHBOARD_STATS: StatItem[] = [
    { label: 'Process Reviews', value: '23', color: '#007bff', description: 'Pending reviews' },
    { label: 'Efficiency Score', value: '87%', color: '#28a745', description: 'Current rating' },
    { label: 'Optimizations', value: '15', color: '#20c997', description: 'This month' },
    { label: 'Team Members', value: '12', color: '#6f42c1', description: 'Methods team' },
    { label: 'Active Projects', value: '8', color: '#fd7e14', description: 'In progress' },
    { label: 'Success Rate', value: '94%', color: '#e83e8c', description: 'Implementation rate' }
];

// Methods Dashboard Actions (Extended)
export const METHODS_DASHBOARD_ACTIONS: ActionItem[] = [
    { icon: '📋', title: 'Process Review', description: 'Review and optimize production methods' },
    { icon: '📈', title: 'Efficiency Metrics', description: 'Analyze process performance data' },
    { icon: '🔄', title: 'Workflow Optimization', description: 'Improve existing workflows' },
    { icon: '📊', title: 'Quality Reports', description: 'Generate quality assurance reports' },
    { icon: '⚙️', title: 'Methodology Setup', description: 'Configure new methodologies' },
    { icon: '🔍', title: 'Audit & Compliance', description: 'Conduct process audits' }
];
