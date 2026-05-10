// Windymilerun — Google Apps Script for Sheets Form Collection
// Deploy as: Extensions → Apps Script → Deploy → New deployment → Web app
//   Execute as: Me  |  Access: Anyone
// Copy the web app URL and paste it into index.html as SHEETS_ENDPOINT

var SHEET_NAME = 'Waitlist';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone',
        'Neighborhood', 'How They Heard', 'UTM Source', 'UTM Campaign'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.firstName   || '',
      data.lastName    || '',
      data.email       || '',
      data.phone       || '',
      data.neighborhood || '',
      data.howHeard    || '',
      data.utmSource   || '',
      data.utmCampaign || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// doGet lets you test the endpoint is live by visiting it in a browser
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Windymilerun Sheets endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
