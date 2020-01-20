'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');

(async() => {

//PARAMS
const login = process.env.LOGIN ? process.env.LOGIN : 'DEFAULT_VALUE'
const password = process.env.PASSWORD ? process.env.PASSWORD : 'DEFAULT_VALUE'

const dashboardUrl = process.env.DASHBOARD_URL
const grafanaUrl = process.env.GRAFANA_URL ? process.env.GRAFANA_URL : 'DEFAULT_VALUE'
const loginUrl = grafanaUrl + '/login'
const dashboardApiUrl = grafanaUrl + '/api/snapshots'

//SNAPSHOT CONFIG
const snapshotName = process.env.SNAPSHOT_NAME
const timeoutInSeconds = process.env.TIMEOUT ? process.env.TIMEOUT : '120'
const requestTimeoutInMillisecond = 150000

const reportName = ( process.env.REPORT_NAME ? process.env.REPORT_NAME :'result') + '.json'

//INIT BROWSER
const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
//const browser = await puppeteer.launch({headless: false}); // For debug
const page = await browser.newPage();
await page.setDefaultNavigationTimeout(requestTimeoutInMillisecond);

//LOGIN
console.log("-GOING TO ", loginUrl)
await page.goto(loginUrl, {waitUntil: 'load'});
await page.type('[name=username]',login);
await page.type('[name=password]',password);
await page.click('.login-button-group button');
await page.waitForNavigation();

//OPEN DASHBOARD
console.log("-GOING TO ", dashboardUrl)
await page.goto(dashboardUrl,{waitUntil: 'load'});

//MAKING SNAPSHOT
await page.waitForSelector('.navbar-button--share', {visible: true})
await page.click('.navbar-button--share');
await page.waitForSelector('.gf-tabs-item a', {visible: true})
await page.evaluate(_ => {
      document.querySelectorAll('.gf-tabs-item a')[1].click()
});
//SET SNAPSHOT PARAMS
await page.evaluate(_ => {document.querySelectorAll('.gf-tabs-item a')[1].click()});
await page.evaluate(_ => {
      document.querySelectorAll('.share-modal-content .gf-form input')[0].value = "";
      document.querySelectorAll('div.gf-form input[type=number]')[0].value = "";
});
await page.type('.share-modal-content .gf-form input', snapshotName);
await page.type('div.gf-form input[type=number]', timeoutInSeconds);

//SUBMIT
console.log('-SUBMITTING SNAPSHOT ', snapshotName)
await page.evaluate(_ => { document.querySelectorAll('.share-modal-content .btn-success')[0].click()});

//EXTRACT SNAPSHOT DATA
console.log('-WAITING RESPONSE FROM ', dashboardApiUrl)
const snapshotDetails = await page.waitForResponse(response =>
      response.url() === dashboardApiUrl && response.status() === 200 ,
      {timeout:0});

console.log("-SAVING RESULTS AS ", reportName)
fs.writeFileSync('/app/results/' + reportName, await snapshotDetails.text());

await browser.close();

})();
