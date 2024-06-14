import express from 'express';
import renderChart from './renderD3.js';
import 'dotenv/config.js';
import Postmark from 'postmark';
const app = express();
const PORT = 3000;
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on AWS Lambda!' });
});
app.get('/chart', async (req, res) => {
  const {
    html: renderedHTML,
    pngBuffer: chart1PNG,
    pngBuffer2: chart2PNG,
    email: email,
  } = await renderChart(req.query.meetingid);

  // console log the rendered HTML
  res.send(`<html><body>${renderedHTML}</body></html>`);
  const finalHTML = renderedHTML.replace(
    /<img id="chart1" src="data:image\/png;charset=utf-8;base64,[^"]+"/,
    '<img src="cid:chart1"'
  ).replace(
    /<img id="chart2" src="data:image\/png;charset=utf-8;base64,[^"]+"/,
    '<img src="cid:chart2"'
  );
  const attachments = [{
    "Name": "image.jpg",
    "Content": chart1PNG.toString('base64'),
    "ContentType": "image/png",
    "ContentID": 'cid:chart1'
  },
  {
    "Name": "image2.jpg",
    "Content": chart2PNG.toString('base64'),
    "ContentType": "image/png",
    "ContentID": 'cid:chart2'
  }

];
  
  const client = new Postmark.ServerClient(process.env.POSTMARK_SERVER_API_TOKEN);
  client.sendEmail({
    "From": process.env.POSTMARK_FROM_EMAIL,
    "To": email,
    "Subject": "Syneurgy just finished processing a meeting.",
    "HtmlBody": finalHTML,
    "Attachments": attachments,
    "ReplyTo": process.env.POSTMARK_FROM_EMAIL,
    "TrackOpens": true
  }, (error, result) => {
    if (error) {
      console.error("Unable to send via postmark: " + error.message);
      return;
    }
    console.log("Sent to postmark for delivery");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
