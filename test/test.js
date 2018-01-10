const assert = require('assert');
const Handlebars = require('handlebars');
const fs = require('fs');
const markdownlint = require('markdownlint');

describe('Email Templates', function () {

    const firstName = "some test first name";

    it('markdown template should compile and set name', function (done) {
        const emailTextTemplate = Handlebars.compile(fs.readFileSync('src/email.md', 'utf8'));
        const email = emailTextTemplate({firstName});

        assert.ok(contains(email, firstName));
        markdownlint({strings:[email]}, done);
    });
});

function contains(body, searchString) {
    return body.indexOf(searchString) !== -1;
}
