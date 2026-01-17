export default function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0];
    }
    return req.socket.remoteAddress;
}