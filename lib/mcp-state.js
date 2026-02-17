const transports = global.mcpTransports || new Map();
if (process.env.NODE_ENV !== 'production') global.mcpTransports = transports;

export { transports };
