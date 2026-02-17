import crypto from 'node:crypto';

export class NextJSSETransport {
    constructor(endpoint, controller) {
        this.endpoint = endpoint;
        this.controller = controller;
        this.sessionId = crypto.randomUUID();
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
    }

    async start() {
        // Send the initial endpoint message
        this.send({
            method: "endpoint/created",
            params: {
                uri: `${this.endpoint}?sessionId=${this.sessionId}`
            }
        });
    }

    async send(message) {
        try {
            const data = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
            this.controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
            if (this.onerror) this.onerror(error);
        }
    }

    async handleMessage(message) {
        if (this.onmessage) {
            await this.onmessage(message);
        }
    }

    close() {
        if (this.onclose) this.onclose();
    }
}
