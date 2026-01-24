export const getDepartmentInfo = (user: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (user?.role === 'Admin') {
        return { displayText: user.role, showDepartment: false };
    } else {
        const department = user?.department_name
        return {
            displayText: department || '',
            showDepartment: true
        };
    }
};

export const getPendingRoute = (departmentId: number | undefined): string => {
    if (!departmentId) return '/dashboard';

    const departmentRoutes: Record<number, string> = {
        10: '/dimensional-inspection',
        9: '/metallurgical-inspection',
        8: '/mc-shop',
        6: '/moulding',
        7: '/pouring',
        3: '/material-correction',
        4: '/sand',
        5: '/visual-inspection',
        2: '/foundry-sample-card'
    };

    return departmentRoutes[departmentId] || '/dashboard';
};