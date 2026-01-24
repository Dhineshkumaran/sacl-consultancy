export const validate = (schema: any, data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const result = schema.safeParse(data);
    if (!result.success) {
        const error = result.error.issues[0];
        throw new Error(`Validation failed in ${error.path}:` + " " + error.message);
    }
    return result.data;
};