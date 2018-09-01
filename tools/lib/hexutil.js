/******************************************************************************

    Blog - My personal blog
    Copyright (C) 2018  Hugo Xu

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*******************************************************************************

    Hexadecimal utility

******************************************************************************/

"use strict";

/*****************************************************************************/

/**
 * Dump a buffer as hexadecimal string.
 * @function
 * @param {Buffer} buff - The buffer to dump.
 */
exports.dump = (buff) => {
    for (const val of buff) {
        process.stdout.write("0x" + val.toString(16).padStart(2, "0") + " ");
    }
    process.stdout.write("\n");
};

/*****************************************************************************/

/**
 * Add value into a buffer array. Index 0 must be the least significant byte.
 * The calculation is done in place.
 * @function
 * @param {Buffer} arr - The buffer array.
 * @param {integer} val - The value to add.
 */
exports.add = (arr, val) => {
    let carry = val;
    for (let i = 0; i < arr.length; i++) {
        let temp = arr[i] + carry;
        arr[i] = temp % 0x100;
        carry = Math.floor(temp / 0x100);
        if (carry === 0) {
            break;
        }
    }
    if (carry !== 0) {
        console.warn("WRN: Overflow when adding, extra carry discarded");
    }
};

/*****************************************************************************/
