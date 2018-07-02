/**
 * Blog build script.
 */
"use strict";


/**
 * Modules.
 * @const {Module}
 */
const fs = require("fs-extra");
const os = require("os");
const showdown = require("showdown");
/**
 * Showdown converter.
 * @const {Converter}
 */
const converter = new showdown.Converter();

/**
 * Generate content of the index file.
 * @function
 * @param {Object} config - The configuration object.
 * @return {string} The generated content
 */
const index_content = (config) => {
    let result = "";

    for (const page of config.pages) {
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

/**
 * Main function
 * @async @function
 */
const main = async () => {
    let config = await fs.readFile("./src/config.json", "utf8");
    config = JSON.parse(config);

    await fs.copy("./src/css/common.css", "./docs/common.css");
    await fs.copy("./src/css/index.css", "./docs/index.css");
    await fs.copy("./src/css/page.css", "./docs/page.css");

    let index = await fs.readFile("./src/index.html", "utf8")
    index = index
        .replace("{{csp}}", config.csp)
        .replace("{{title-suffix}}", config.suffix)
        .replace("{{content}}", index_content(config));
    await fs.writeFile("./docs/index.html", index, "utf8");

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
        await fs.writeFile("./docs/" + page.src + ".html", output, "utf8");
    }
};


process.on("unhandledRejection", (e) => {
    throw e;
});
main();
