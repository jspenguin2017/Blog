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

// Hexadecimal utilities

// ------------------------------------------------------------------------------------------------------------------ //

"use strict";

// ------------------------------------------------------------------------------------------------------------------ //

exports.hex_dump = (buff) => {
    for (const val of buff) {
        process.stdout.write("0x" + val.toString(16).padStart(2, "0") + " ");
    }
    process.stdout.write("\n");
};

// ------------------------------------------------------------------------------------------------------------------ //

exports.add_carry = (bytes_array, value_to_add) => {
    let carry = value_to_add;

    for (let i = 0; i < bytes_array.length; i++) {
        let temp = bytes_array[i] + carry;
        bytes_array[i] = temp % 0x100;
        carry = Math.floor(temp / 0x100);
        if (carry === 0) {
            break;
        }
    }

    if (carry !== 0) {
        console.warn("WRN: Final carry discarded");
    }
};

// ------------------------------------------------------------------------------------------------------------------ //
