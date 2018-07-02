/**
 * Blog build script.
 */
"use strict";

/**
 * Modules.
 * @const {Module}
 */
const showdown = require("showdown");

/**
 * Showdown converter.
 * @const {Converter}
 */
const converter = new showdown.Converter();


console.log(converter.makeHtml('# Title\n```JavaScript\ntest\n```'));
