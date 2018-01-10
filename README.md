[![Build Status](https://travis-ci.org/HarryEMartland/CYFIntoEmail.svg?branch=master)](https://travis-ci.org/HarryEMartland/CYFIntoEmail)

# CYFIntoEmail
Sends an email using AWS to introduce applicants stored in PipeDrive

#### Package the app ready for upload to aws
```
npm run zip
```

#### Run the app locally
You will need to set the environment variables `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `PIPEDRIVE_KEY`  
```
npm start
```

#### Test markdown output
```
node src/testMarkdown.js
```
This will create two files `src/email.html` and `src/email.txt` you can open the html file in a browser to check how things look.

For information on how to write markdown see the [markdown cheat sheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#links).