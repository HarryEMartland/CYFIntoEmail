const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fs = require('fs');
const Handlebars = require('handlebars');
const formurlencoded = require('form-urlencoded');

const pipedriveKey = process.env.PIPEDRIVE_KEY;
const pipedriveBaseUrl = 'https://api.pipedrive.com/v1/';
const generalApplicationStage = '1';
const emailSentStage = "20";
const dealLimit = 50;//to stop the request limit running out when updating
const aMonth = 2629746;

const emailHtmlTemplate = Handlebars.compile(fs.readFileSync('src/email.html', 'utf8'));
const emailTextTemplate = Handlebars.compile(fs.readFileSync('src/email.txt', 'utf8'));

const shouldInviteToSlack = process.env.INVITE_TO_SLACK || false;
const slackExpiry = process.env.SLACK_EXPIRY || aMonth;
const slackChannel = process.env.SLACK_CHANNEL || "C8MJQFY2C";
const slackAPIKey = process.env.SLACK_API_KEY;

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
    return fetch(pipedriveBaseUrl + '/deals?&limit=' + dealLimit + '&user_id=' + process.env.PIPEDRIVE_USER_ID + '&stage_id=' + generalApplicationStage + '&status=open&api_token=' + pipedriveKey)
        .then(body => body.json())
        .then(response => response.data || []);
}

function processDeal(deal) {
    console.log("starting processing " + deal.id);
    return sendEmail(deal)
        .then(() => deal)
        .then(moveDeal)
        .then(inviteToSlack)
        .then(function (data) {
            console.log("finished processing  " + deal.id);
            return data;
        });
}

function inviteToSlack(deal) {
    if (shouldInviteToSlack) {

        let formData = formurlencoded({
            'channels': slackChannel,
            'email': deal.person_id.email[0].value,
            'ultra_restricted': 'true',
            'expiration_ts': (Date.now() / 1000) + slackExpiry,
            'first_name': deal.firstName
        });

        return fetch("https://slack.com/api/users.admin.invite", {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + slackAPIKey,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        })
    }
    return deal;
}

function moveDeal(deal) {
    return fetch(pipedriveBaseUrl + '/deals/' + deal.id + '?api_token=' + pipedriveKey, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "stage_id": emailSentStage
        })
    }).then(() => deal);
}

function sendEmail(deal) {
    let name = deal.person_id.name;
    deal.firstName = name.split(' ')[0];
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
                Data: "CYF - Welcome " + name + "!"
            }
        },
        Source: deal.user_id.email,
    }).promise();
}