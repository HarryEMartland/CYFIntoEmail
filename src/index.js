const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fs = require('fs');
const Handlebars = require('handlebars');

const pipedriveKey = process.env.PIPEDRIVE_KEY;
const pipedriveBaseUrl = 'https://api.pipedrive.com/v1/';
const manchesterUserId = '2643534';
const generalApplicationStage = '1';
const emailSentStage = "20";

const emailHtmlTemplate = Handlebars.compile(fs.readFileSync('src/email.html', 'utf8'));
const emailTextTemplate = Handlebars.compile(fs.readFileSync('src/email.txt', 'utf8'));

AWS.config.region = 'eu-west-1';
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});
const ses = new AWS.SES();

exports.handler = function (event, context, callback) {

    findNewApplicants()
        .then(function (deals) {
            return Promise.all(deals.map(processDeal));
        })
        .then(function () {
            callback(null, null);
        })
        .catch(function (error) {
            console.error(error);
            callback(error, null);
        })
};

function findNewApplicants() {
    return fetch(pipedriveBaseUrl+'/deals?&user_id='+manchesterUserId+'&stage_id='+generalApplicationStage+'&status=open&api_token=' + pipedriveKey)
        .then(body=>body.json())
        .then(response=>response.data || []);
}

function processDeal(deal) {

    return sendEmail(deal)
        .then(()=>deal)
        .then(moveDeal)
        .then(function (data) {
            console.log("email sent to deal " + deal.id);
            return data;
        });
}

function moveDeal(deal) {
    return fetch(pipedriveBaseUrl+'/deals/'+deal.id+'?api_token=' + pipedriveKey, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "stage_id": emailSentStage
        })
    });
}

function sendEmail(deal) {
    deal.firstName = deal.person_id.name.split(' ')[0];
    return ses.sendEmail({
        Destination: {
            BccAddresses: [deal.cc_email],
            CcAddresses: [],
            ToAddresses: [
                deal.person_id.email[0].value
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: emailHtmlTemplate(deal)
                },
                Text: {
                    Charset: "UTF-8",
                    Data: emailTextTemplate(deal)
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Code Your Future Application"
            }
        },
        Source: deal.user_id.email,
    }).promise();
}