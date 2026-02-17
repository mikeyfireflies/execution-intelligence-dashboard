const transports = global.mcpTransports || new Map();
global.mcpTransports = transports;

export { transports };
