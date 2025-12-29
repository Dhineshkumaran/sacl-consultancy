export const getDepartmentName = (departmentId: number | string | undefined): string | null => {
    if (!departmentId) return null;
    const id = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;

    const departmentMap: Record<number, string> = {
        1: 'ADMIN',
        2: 'METHODS',
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
    if (user?.role === 'Admin') {
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

export const getPendingRoute = (currentForm: string | undefined): string => {
    if (!currentForm) return '/dashboard';

    const departmentRoutes: Record<string, string> = {
        'DIMENSIONAL_INSPECTION': '/dimensional-inspection',
        'METALLURGICAL_INSPECTION': '/metallurgical-inspection',
        'MC_SHOP': '/mc-shop',
        'MOULDING': '/moulding',
        'POURING': '/pouring',
        'MATERIAL_CORRECTION': '/material-correction',
        'SANDPLANT': '/sand',
        'VISUAL_INSPECTION': '/visual-inspection',
        'METALLURGICAL_SPECIFICATION': '/foundry-sample-card'
    };

    // METALLURGICAL_SPECIFICATION, MATERIAL_CORRECTION, POURING, SANDPLANT, MOULDING, METALLURGICAL_INSPECTION, VISUAL_INSPECTION, DIMENSIONAL_INSPECTION, MC_SHOP

    return departmentRoutes[currentForm] || '/dashboard';
};