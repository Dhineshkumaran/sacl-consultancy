import Client from '../config/connection.js';

export const getAllDepartments = async (req, res, next) => {
    const [departments] = await Client.query(
        `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );
    res.status(200).json({
        success: true,
        data: departments || []
    });
};
