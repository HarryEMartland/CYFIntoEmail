const markdown = require('markdown').markdown;
const removeMarkdown = require('remove-markdown');
const fs = require('fs');
const Handlebars = require('handlebars');

const deal = {firstName:"test", user_id:{email:"manchester@codeyourfuture.io"}};

let markdownTemplate = Handlebars.compile(fs.readFileSync('src/email.md', 'utf8'));

let emailMarkdown = markdownTemplate(deal);


fs.writeFileSync("src/email.html", markdown.toHTML(emailMarkdown));
fs.writeFileSync("src/email.txt", removeMarkdown(emailMarkdown,{stripListLeaders:false}));