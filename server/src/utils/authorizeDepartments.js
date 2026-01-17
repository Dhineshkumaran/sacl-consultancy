import CustomError from "../utils/customError.js";

const authorizeDepartments = (...departments) => {
    return (req, res, next) => {
        const department = req.user?.department_id;
        if(!departments.includes(department)){
            const error = new CustomError('Access Denied', 403);
            return next(error);
        }
        next();
    }
}

export default authorizeDepartments;