const {google} = require('googleapis');

async function getMessage(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    const email_list = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1,
        q: `from:reservas@regio.travel`
    })
    const email_message = email_list.data.messages[0].id
    const email_text = await gmail.users.messages.get({
        userId: 'me',
        id: email_message
    })
    const firstNumbers = email_text.data.snippet.match(/\d+/)[0];
    return firstNumbers
}
module.exports = getMessage