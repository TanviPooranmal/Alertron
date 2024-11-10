import { GSContext, logger } from "@godspeedsystems/core";

/**
 * Customize the response when a request or response validation error occurs.
 * This function handles validation errors, logs them, and formats a consistent response for Alertron's workflows.
 * @param ctx - GSContext contains all input and output data for the request.
 */
export default function (ctx: GSContext) {
    // Extract validation errors, event information, and custom error message
    const { validation_error, event, message, inquiry_id, customer_name } = ctx.inputs.data;

    // Log the validation error for debugging or monitoring purposes
    logger.error("Validation Error: %o", validation_error);

    // Return a structured error response with relevant details
    return {
        success: false,
        message: `Error occurred while processing inquiry ${inquiry_id} from customer ${customer_name}.`,
        data: {
            validation_error,
            event,
            message,
            inquiry_id,
            customer_name,
        },
        code: 400, // Bad request due to validation failure
    };
}
