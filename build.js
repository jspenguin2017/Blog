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

// Blog build script

// ------------------------------------------------------------------------------------------------------------------ //

"use strict";

// ------------------------------------------------------------------------------------------------------------------ //

process.on("unhandledRejection", (e) => {
    throw e;
});

// ------------------------------------------------------------------------------------------------------------------ //

const fs = require("fs-extra");
const os = require("os");
const showdown = require("showdown");

const converter = new showdown.Converter();

// ------------------------------------------------------------------------------------------------------------------ //

const index_content = (config) => {
    let result = "";

    for (const page of config.pages) {
        if (!page.published) {
            continue;
        }

        result += [
            '<div class="post">',
            '    <h3>',
            '        <a href="' + page.src + '.html">' + page.title + '</a>',
            '    </h3>',
            '    <br />',
            '    <p>' + page.summary + '</p>',
            '</div>',
        ].join(os.EOL);
    }

    return result;
};

// ------------------------------------------------------------------------------------------------------------------ //

const fix_line_ending = (text) => {
    return text
        .split("\n")
        .map((line) => line.replace(/\r$/, ""))
        .join(os.EOL);
};

// ------------------------------------------------------------------------------------------------------------------ //

const main = async () => {
    let config = await fs.readFile("./src/config.json", "utf8");
    config = JSON.parse(config);

    await fs.copy("./src/css/common.css", "./docs/common.css");
    await fs.copy("./src/css/index.css", "./docs/index.css");
    await fs.copy("./src/css/page.css", "./docs/page.css");

    let index = await fs.readFile("./src/index.html", "utf8");
    index = index
        .replace("{{csp}}", config.csp)
        .replace("{{title-suffix}}", config.suffix)
        .replace("{{content}}", index_content(config));
    await fs.writeFile("./docs/index.html", fix_line_ending(index), "utf8");

    let template = await fs.readFile("./src/page.html", "utf8");
    template = template
        .replace("{{csp}}", config.csp)
        .replace("{{title-suffix}}", config.suffix);

    for (const page of config.pages) {
        let content = await fs.readFile("./src/pages/" + page.src + ".MD", "utf8");
        content = converter.makeHtml(content);

        let output = template
            .replace("{{title}}", page.title)
            .replace("{{content}}", content);
        await fs.writeFile("./docs/" + page.src + ".html", fix_line_ending(output), "utf8");
    }
};

main();

// ------------------------------------------------------------------------------------------------------------------ //
