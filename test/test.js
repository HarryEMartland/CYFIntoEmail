const assert = require('assert');
const Handlebars = require('handlebars');
const fs = require('fs');
const w3c = require('w3c-validate').createValidator();
const htmllint = require('htmllint');

const htmlLintConf={
    "tag-bans":[]
};


describe('Email Templates', function () {

    const firstName = "some test first name";

    it('html template should compile and set name', function (done) {
        const emailHtmlTemplate = Handlebars.compile(fs.readFileSync('src/email.html', 'utf8'));
        const email = emailHtmlTemplate({firstName});

        assert.ok(contains(email, firstName));


        w3c.validate('<!DOCTYPE HTML SYSTEM><html><head><title>test</title></head><body>'+email+'</body></html>', done);
    });

    it('txt template should compile and set name', function () {
        const emailTextTemplate = Handlebars.compile(fs.readFileSync('src/email.txt', 'utf8'));
        const email = emailTextTemplate({firstName});

        assert.ok(contains(email, firstName))
    });
});

function contains(body, searchString) {
    return body.indexOf(searchString) !== -1;
}
