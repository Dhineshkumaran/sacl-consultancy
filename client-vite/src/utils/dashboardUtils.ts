export const getDepartmentName = (departmentId: number | string | undefined): string | null => {
    if (!departmentId) return null;
    const id = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;

    const departmentMap: Record<number, string> = {
        1: 'ADMIN',
        2: 'NPD METHODS',
        3: 'NPD QC',
        4: 'SANDPLANT',
        5: 'FETTLING & VISUAL INSPECTION',
        6: 'MOULDING',
        7: 'QUALITY',
        8: 'MACHINESHOP',
        9: 'NDT QC',
        10: 'QA',
        11: 'CUSTOMER'
    };

    return departmentMap[id] || null;
};

export const getDepartmentInfo = (user: any) => {
    if (user?.role === 'Admin' || user?.role === 'Methods') {
        return { displayText: user.role, showDepartment: false };
    } else {
        const department = user?.department_name ||
            user?.department ||
            getDepartmentName(user?.department_id);

        return {
            displayText: department || 'Operations',
            showDepartment: true
        };
    }
};

export const getPendingRoute = (departmentIdRaw: number | string | undefined): string => {
    const departmentId = typeof departmentIdRaw === 'string' ? Number(departmentIdRaw) : departmentIdRaw;

    if (!departmentId) return '/dashboard';

    const departmentRoutes: Record<number, string> = {
        10: '/dimensional-inspection',
        7: '/metallurgical-inspection',
        8: '/machine-shop',
        6: '/moulding',
        9: '/pouring-details',
        4: '/sand',
        5: '/visual-inspection',
    };

    return departmentRoutes[departmentId] || '/dashboard';
};
