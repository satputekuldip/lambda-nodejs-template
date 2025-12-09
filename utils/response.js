const sendError = (message, statusCode = 400) => {
    return {
        success: false,
        message,
    };
};

// Helper function to send success response
const sendResponse = (data, message) => {
    return {
        success: true,
        message,
        data,
    };
};
export {sendError, sendResponse};
