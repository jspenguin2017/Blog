/**
 * Netcat utility.
 */
"use strict";

/**
 * Load modules.
 * @const {Module}
 */
const net = require("net");

/**
 * Netcat class.
 * Note that clean up is not implemented, so the class cannot be disposed once
 * constructed.
 * @class
 */
module.exports = class {
    /**
     * Constructor. Create a connection.
     * @constructor
     * @param {string} addr - The address.
     * @param {integer} port - The port.
     * @param {bool} [intr=true] - Whether the user can write into the
     *     connection stream at any time.
     */
    constructor(addr, port, intr = true) {
        this._conn = net.connect(port, addr);

        this._buff = null;
        this._on_data = null;

        this._conn.on("data", (chunk) => {
            process.stdout.write(chunk);

            if (this._buff === null) {
                this._buff = chunk;
            } else {
                this._buff = Buffer.concat([this._buff, chunk]);
            }

            if (this._on_data !== null) {
                this._on_data();
            }
        });
        this._conn.on("error", (err) => {
            console.log();
            console.log();
            console.error("ERR: " + err.message);
            console.error(err.stack);
        });
        this._conn.on("close", () => {
            console.log();
            console.log();
            console.error("WRN: Disconnected");
        });

        if (intr) {
            process.stdin.setEncoding("utf8");
            process.stdin.resume();
            process.stdin.on("data", (chunk) => {
                this.write(chunk.replace(/\r\n/g, "\n"), false);
            });
        }
    }

    /**
     * Write raw data.
     * @method
     * @param {Buffer|string} buff - The data to write.
     * @param {bool} [echo=true] - Whether the data should be written to
     *     stdout as well.
     */
    write(buff, echo = true) {
        if (echo) {
            process.stdout.write(buff);
        }

        this._conn.write(buff);
    }
    /**
     * Write a line.
     * @method
     * @param {string} str - The line to write.
     */
    write_line(str) {
        this.write(str + "\n");
    }

    /**
     * Read a set number of bytes.
     * @async @method
     * @param {integer} byte - The number of bytes to read.
     * @return {Buffer} The bytes read.
     */
    read(byte) {
        return new Promise((resolve, reject) => {
            const check_buffer = () => {
                if (this._buff === null) {
                    this._on_data = check_buffer;

                } else {
                    if (this._buff.length > byte) {
                        resolve(this._buff.slice(0, byte));
                        this._buff = this._buff.slice(byte);
                        this._on_data = null;

                    } else if (this._buff.length === byte) {
                        resolve(this._buff);
                        this._buff = null;
                        this._on_data = null;

                    } else {
                        this._on_data = check_buffer;

                    }

                }
            };
            check_buffer();
        });
    }
    /**
     * Read until a pattern is found.
     * @async @method
     * @param {Buffer|string} pattern - The pattern.
     * @return {Buffer} The bytes read, including the pattern.
     */
    read_until(pattern) {
        return new Promise((resolve, reject) => {
            const check_buffer = () => {
                if (this._buff === null) {
                    this._on_data = check_buffer;

                } else {
                    const i = this._buff.indexOf(pattern);
                    if (i === -1) {
                        this._on_data = check_buffer;
                    } else {
                        const to_cut = i + pattern.length;

                        if (this._buff.length === to_cut) {
                            resolve(this._buff);
                            this._buff = null;
                        } else {
                            resolve(this._buff.slice(0, to_cut));
                            this._buff = this._buff.slice(to_cut);
                        }

                        this._on_data = null;
                    }

                }
            };
            check_buffer();
        });
    }
    /**
     * Read a line.
     * @async @method
     * @param {string} [encoding=utf8] - The encoding.
     * @return {string} The line read, including the new line character.
     */
    async read_line(encoding = "utf8") {
        const res = await this.read_until("\n");
        return res.toString(encoding);
    }
    /**
     * Read everything from the buffer, but wait until at least one byte is
     * present.
     * @async @method
     * @return {Buffer} The bytes read.
     */
    read_all() {
        return new Promise((resolve, reject) => {
            const check_buffer = () => {
                if (this._buff === null) {
                    this._on_data = check_buffer;

                } else {
                    resolve(this._buff);
                    this._buff = null;
                    this._on_data = null;

                }
            };
            check_buffer();
        });
    }
};
