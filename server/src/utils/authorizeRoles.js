import CustomError from "../utils/customError.js";

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const role = req.user?.role;
        if(!roles.includes(role)){
            const error = new CustomError('Access Denied', 403);
            return next(error);
        }
        next();
    }
}

export default authorizeRoles;