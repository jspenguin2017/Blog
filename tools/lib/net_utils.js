// ------------------------------------------------------------------------------------------------------------------ //

// Blog - My personal blog
// Copyright (C) 2018-2022  Hugo Xu
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// ------------------------------------------------------------------------------------------------------------------ //

// Network utilities

// ------------------------------------------------------------------------------------------------------------------ //

"use strict";

// ------------------------------------------------------------------------------------------------------------------ //

const net = require("net");

// ------------------------------------------------------------------------------------------------------------------ //

// Clean up is not implemented
// Up to one event can be awaited at any given time
module.exports = class {
    constructor(address, port, interactive = true) {
        this._conn = net.connect(port, address);

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

        if (interactive) {
            process.stdin.setEncoding("utf8");
            process.stdin.resume();
            process.stdin.on("data", (chunk) => {
                this.write_bytes(chunk.replace(/\r\n/g, "\n"), false);
            });
        }
    }

    write_bytes(buffer, echo = true) {
        if (echo) {
            process.stdout.write(buffer);
        }

        this._conn.write(buffer);
    }

    write_line(str) {
        if (!str.endsWith("\n")) {
            str += "\n";
        }
        this.write_bytes(str);
    }

    read_bytes(num_bytes) {
        return new Promise((resolve) => {
            const check_buffer = () => {
                if (this._buff === null) {
                    this._on_data = check_buffer;
                } else {
                    if (this._buff.length > num_bytes) {
                        resolve(this._buff.slice(0, num_bytes));
                        this._buff = this._buff.slice(num_bytes);
                        this._on_data = null;
                    } else if (this._buff.length === num_bytes) {
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

    read_until(end_string) {
        return new Promise((resolve) => {
            const check_buffer = () => {
                if (this._buff === null) {
                    this._on_data = check_buffer;
                } else {
                    const i = this._buff.indexOf(end_string);
                    if (i === -1) {
                        this._on_data = check_buffer;
                    } else {
                        const to_cut = i + end_string.length;

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

    async read_line(encoding = "utf8") {
        const res = await this.read_until("\n");
        return res.toString(encoding);
    }

    read_all_bytes() {
        return new Promise((resolve) => {
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

// ------------------------------------------------------------------------------------------------------------------ //
