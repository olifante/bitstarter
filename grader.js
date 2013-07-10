#!/usr/bin/env node

/*jslint node: true, indent: 4, vars: true */
"use strict";

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var sys = require('util');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function (infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function (htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function (checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function (htmlfile, checksfile) {
    var ii;
    var $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (ii in checks) {
        if (checks.hasOwnProperty(ii)) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
    }
    return out;
};

var checkUrl = function (urlText, checksfile) {
    var ii;
    var $ = cheerio.load(urlText);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (ii in checks) {
        if (checks.hasOwnProperty(ii)) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
    }
    return out;
};

var clone = function (fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main === module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json',
        clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html',
        clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL')
        .parse(process.argv);
    if (program.checks) console.log('  - checks ' + program.checks);
    if (program.url) {
        console.log('  - url ' + program.url);

        rest.get(program.url).on('complete', function (result) {
            if (result instanceof Error) {
                sys.puts('Error: ' + result.message);
                this.retry(5000); // try again after 5 sec  
            } else {
                //                console.log(typeof result);
                var checkJson = checkUrl(result, program.checks);
                var outJson = JSON.stringify(checkJson, null, 4);
                console.log(outJson);
            }
        });
    } else if (program.file) {
        console.log('  - file ' + program.file);
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}