import {
    loginService,
    changePasswordService,
    getProfileService,
} from "../services/authService.js";

export const loginController = async (
    req,
    res,
    next
) => {

    try {

        const {
            identifier,
            password,
        } = req.body;

        const result =
            await loginService(
                identifier,
                password
            );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result,
        });

    } catch (error) {

        next(error);

    }

};



export const changePasswordController = async (
    req,
    res,
    next
) => {

    try {

        const {
            currentPassword,
            newPassword,
        } = req.body;

        await changePasswordService(
            req.user.id,
            currentPassword,
            newPassword
        );

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully.",
        });

    } catch (error) {

        next(error);

    }

};



export const getProfileController = async (
    req,
    res,
    next
) => {

    try {

        const profile =
            await getProfileService(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            data: profile,
        });

    } catch (error) {

        next(error);

    }

};