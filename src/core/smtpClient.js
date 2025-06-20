const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const log = require('./logger');

/**
 * SMTP Client Implementation - No External Dependencies
 * Supports SMTP AUTH (PLAIN, LOGIN), TLS/SSL, multiple ports
 * RFC 5321 compliant with modern extensions
 */
class SMTPClient {
    constructor(config = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 587,
            secure: config.secure || false, // true for 465, false for other ports
            auth: config.auth || null, // { user: 'email', pass: 'password' }
            timeout: config.timeout || 30000,
            retries: config.retries || 3,
            ...config
        };
        
        this.socket = null;
        this.secure = this.config.secure;
        this.authenticated = false;
        this.capabilities = [];
    }

    /**
     * Send email with retry logic
     */
    async sendMail(mailOptions) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.retries; attempt++) {
            try {
                log.info(`SMTP: Sending email attempt ${attempt}/${this.config.retries}`);
                return await this._sendMailAttempt(mailOptions);
            } catch (error) {
                lastError = error;
                log.warn(`SMTP: Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < this.config.retries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    log.info(`SMTP: Retrying in ${delay}ms...`);
                    await this._sleep(delay);
                }
            }
        }
        
        throw new Error(`SMTP: All ${this.config.retries} attempts failed. Last error: ${lastError.message}`);
    }

    /**
     * Single email send attempt
     */
    async _sendMailAttempt(mailOptions) {
        try {
            await this._connect();
            await this._authenticate();
            await this._sendMessage(mailOptions);
            await this._quit();
            
            log.info(`SMTP: Email sent successfully to ${mailOptions.to}`);
            return { success: true, messageId: this._generateMessageId() };
        } catch (error) {
            await this._close();
            throw error;
        }
    }

    /**
     * Connect to SMTP server
     */
    async _connect() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('SMTP: Connection timeout'));
            }, this.config.timeout);

            // Connect based on port and security
            if (this.config.port === 465 || this.secure) {
                // Direct TLS connection
                this.socket = tls.connect({
                    host: this.config.host,
                    port: this.config.port,
                    rejectUnauthorized: false // For development/testing
                });
            } else {
                // Plain connection (will upgrade to TLS if needed)
                this.socket = net.connect({
                    host: this.config.host,
                    port: this.config.port
                });
            }

            this.socket.setTimeout(this.config.timeout);
            
            this.socket.on('connect', () => {
                clearTimeout(timeout);
                log.info(`SMTP: Connected to ${this.config.host}:${this.config.port}`);
            });

            this.socket.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`SMTP: Connection error - ${error.message}`));
            });

            this.socket.on('timeout', () => {
                clearTimeout(timeout);
                reject(new Error('SMTP: Socket timeout'));
            });

            // Wait for server greeting
            this._waitForResponse(220).then(() => {
                resolve();
            }).catch(reject);
        });
    }

    /**
     * SMTP Authentication
     */
    async _authenticate() {
        // Send EHLO to get server capabilities
        await this._sendCommand('EHLO', this.config.host || 'localhost');
        const ehloResponse = await this._waitForResponse(250);
        
        // Parse capabilities
        this.capabilities = ehloResponse.split('\n')
            .slice(1) // Skip first line
            .map(line => line.substring(4).trim()); // Remove "250-" or "250 "

        log.info(`SMTP: Server capabilities: ${this.capabilities.join(', ')}`);

        // Start TLS if available and not already secure
        if (!this.secure && this.capabilities.some(cap => cap.startsWith('STARTTLS'))) {
            await this._startTLS();
        }

        // Authenticate if credentials provided
        if (this.config.auth && this.config.auth.user && this.config.auth.pass) {
            await this._performAuth();
        }
    }

    /**
     * Start TLS encryption
     */
    async _startTLS() {
        await this._sendCommand('STARTTLS');
        await this._waitForResponse(220);

        return new Promise((resolve, reject) => {
            const tlsSocket = tls.connect({
                socket: this.socket,
                rejectUnauthorized: false
            });

            tlsSocket.on('secureConnect', () => {
                this.socket = tlsSocket;
                this.secure = true;
                log.info('SMTP: TLS connection established');
                
                // Re-send EHLO after TLS
                this._sendCommand('EHLO', this.config.host || 'localhost')
                    .then(() => this._waitForResponse(250))
                    .then(() => resolve())
                    .catch(reject);
            });

            tlsSocket.on('error', reject);
        });
    }

    /**
     * Perform SMTP AUTH
     */
    async _performAuth() {
        const authMethods = this.capabilities
            .find(cap => cap.startsWith('AUTH'))
            ?.split(' ')
            .slice(1) || [];

        log.info(`SMTP: Available auth methods: ${authMethods.join(', ')}`);

        if (authMethods.includes('PLAIN')) {
            await this._authPlain();
        } else if (authMethods.includes('LOGIN')) {
            await this._authLogin();
        } else {
            throw new Error('SMTP: No supported authentication method available');
        }

        this.authenticated = true;
        log.info('SMTP: Authentication successful');
    }

    /**
     * AUTH PLAIN implementation
     */
    async _authPlain() {
        const credentials = Buffer.from(
            `\0${this.config.auth.user}\0${this.config.auth.pass}`
        ).toString('base64');

        await this._sendCommand('AUTH PLAIN', credentials);
        await this._waitForResponse(235);
    }

    /**
     * AUTH LOGIN implementation
     */
    async _authLogin() {
        await this._sendCommand('AUTH LOGIN');
        await this._waitForResponse(334);

        const username = Buffer.from(this.config.auth.user).toString('base64');
        await this._sendCommand(username);
        await this._waitForResponse(334);

        const password = Buffer.from(this.config.auth.pass).toString('base64');
        await this._sendCommand(password);
        await this._waitForResponse(235);
    }

    /**
     * Send email message
     */
    async _sendMessage(mailOptions) {
        // MAIL FROM
        const fromAddress = this._extractEmail(mailOptions.from || this.config.auth?.user);
        await this._sendCommand('MAIL FROM:', `<${fromAddress}>`);
        await this._waitForResponse(250);

        // RCPT TO (supports multiple recipients)
        const recipients = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];
        for (const recipient of recipients) {
            const toAddress = this._extractEmail(recipient);
            await this._sendCommand('RCPT TO:', `<${toAddress}>`);
            await this._waitForResponse(250);
        }

        // DATA
        await this._sendCommand('DATA');
        await this._waitForResponse(354);

        // Email headers and body
        const emailContent = this._buildEmailContent(mailOptions);
        await this._sendCommand(emailContent + '\r\n.');
        await this._waitForResponse(250);
    }

    /**
     * Build email content with headers
     */
    _buildEmailContent(mailOptions) {
        const messageId = this._generateMessageId();
        const date = new Date().toUTCString();
        
        let content = '';
        content += `Message-ID: <${messageId}>\r\n`;
        content += `Date: ${date}\r\n`;
        content += `From: ${mailOptions.from || this.config.auth?.user}\r\n`;
        content += `To: ${Array.isArray(mailOptions.to) ? mailOptions.to.join(', ') : mailOptions.to}\r\n`;
        
        if (mailOptions.cc) {
            content += `Cc: ${Array.isArray(mailOptions.cc) ? mailOptions.cc.join(', ') : mailOptions.cc}\r\n`;
        }
        
        content += `Subject: ${mailOptions.subject || 'No Subject'}\r\n`;
        content += `MIME-Version: 1.0\r\n`;
        
        if (mailOptions.html) {
            content += `Content-Type: text/html; charset=utf-8\r\n`;
        } else {
            content += `Content-Type: text/plain; charset=utf-8\r\n`;
        }
        
        content += `\r\n`; // Empty line separates headers from body
        content += mailOptions.html || mailOptions.text || '';
        
        return content;
    }

    /**
     * Send SMTP command
     */
    async _sendCommand(command, data = '') {
        const fullCommand = data ? `${command} ${data}\r\n` : `${command}\r\n`;
        
        return new Promise((resolve, reject) => {
            this.socket.write(fullCommand, 'utf8', (error) => {
                if (error) {
                    reject(new Error(`SMTP: Failed to send command - ${error.message}`));
                } else {
                    log.debug(`SMTP: > ${command} ${data ? '[DATA]' : ''}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Wait for SMTP response
     */
    async _waitForResponse(expectedCode) {
        return new Promise((resolve, reject) => {
            let responseData = '';
            
            const onData = (data) => {
                responseData += data.toString();
                
                // Check if response is complete (ends with \r\n)
                if (responseData.endsWith('\r\n')) {
                    this.socket.removeListener('data', onData);
                    
                    const lines = responseData.trim().split('\r\n');
                    const lastLine = lines[lines.length - 1];
                    const responseCode = parseInt(lastLine.substring(0, 3));
                    
                    log.debug(`SMTP: < ${responseCode} ${lastLine.substring(4)}`);
                    
                    if (responseCode === expectedCode || (Array.isArray(expectedCode) && expectedCode.includes(responseCode))) {
                        resolve(responseData.trim());
                    } else {
                        reject(new Error(`SMTP: Expected ${expectedCode}, got ${responseCode}: ${lastLine.substring(4)}`));
                    }
                }
            };
            
            this.socket.on('data', onData);
            
            // Timeout handling
            setTimeout(() => {
                this.socket.removeListener('data', onData);
                reject(new Error('SMTP: Response timeout'));
            }, this.config.timeout);
        });
    }

    /**
     * Quit SMTP session
     */
    async _quit() {
        try {
            await this._sendCommand('QUIT');
            await this._waitForResponse(221);
        } catch (error) {
            log.warn(`SMTP: Error during QUIT: ${error.message}`);
        } finally {
            await this._close();
        }
    }

    /**
     * Close connection
     */
    async _close() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.authenticated = false;
        this.capabilities = [];
    }

    /**
     * Utility methods
     */
    _extractEmail(emailString) {
        const match = emailString.match(/<(.+)>/);
        return match ? match[1] : emailString;
    }

    _generateMessageId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        const hostname = this.config.host || 'localhost';
        return `${timestamp}.${random}@${hostname}`;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = SMTPClient; 