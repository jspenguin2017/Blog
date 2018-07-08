/**
 * Hexadecimal utility.
 */
"use strict";

/**
 * Dump a buffer as hexadecimal.
 * @function
 * @param {Buffer} buff - The buffer to dump.
 */
exports.dump = (buff) => {
    for (const val of buff) {
        process.stdout.write("0x" + val.toString(16).padStart(2, "0") + " ");
    }
    process.stdout.write("\n");
};

/**
 * Add value into a buffer array. Index 0 must be the least significant byte.
 * The calculation is done in place.
 * @function
 * @param {buffer} arr - The buffer array.
 * @param {buffer} val - The value to add.
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
