import express from "express";
import renderChart from "./renderD3.js";
import nodemailer from "nodemailer";
import "dotenv/config.js";

const app = express();
const PORT = 3000;

app.get("/chart", async (req, res) => {
  const {
    html: renderedHTML,
    pngBuffer: chart1PNG,
    pngBuffer2: chart2PNG,
    email: email
  } = await renderChart(req.query.meetingid);

  // console log the rendered HTML
  res.send(`<html><body>${renderedHTML}</body></html>`);

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
        
    },
  });
  
  var mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Syneurgy just finished processing a meeting.",
    html: renderedHTML
      .replace(
        /<img id="chart1" src="data:image\/png;charset=utf-8;base64,[^"]+"/,
        '<img src="cid:chart1"'
      )
      .replace(
        /<img id="chart2" src="data:image\/png;charset=utf-8;base64,[^"]+"/,
        '<img src="cid:chart2"'
      ),
    attachments: [
      {
        filename: "image.png",
        content: chart1PNG, // this should be the buffer of the PNG image
        cid: "chart1", //same cid value as in the html img src
      },
      {
        filename: "image2.png",
        content: chart2PNG, // this should be the buffer of the PNG image
        cid: "chart2",
      },
    ],
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
