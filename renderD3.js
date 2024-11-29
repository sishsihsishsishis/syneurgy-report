import { JSDOM } from "jsdom";
import { select } from "d3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import fetch from "node-fetch";

import { renderRadarChart } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read in the HTML template
const html = fs.readFileSync(path.resolve(__dirname, "./index.html"), "utf8");

async function getData(meetingid) {
  const backendUrl = process.env.BACKEND_URL;
  console.log('backendUrl~~~', backendUrl);
  
  return await fetch(
    `${backendUrl}/csv/radar?meetingID=${meetingid}`
  ).then(async (res) => {
    const data = await res.json();
    return data.data.radar;
  });
}

async function getMeetingDetails(meetingId) {
  const backendUrl = process.env.BACKEND_URL;
  console.log('backendUrl~~~', backendUrl);
  return await fetch(
    `${backendUrl}/meeting/info/${meetingId}`
  ).then(async (res) => {
    const data = await res.json();
    return data.data;
  });
}

async function getTeamSummary(teamId) {
  const backendUrl = process.env.BACKEND_URL;
  console.log('backendUrl~~~', backendUrl);
  return await fetch(
    `${backendUrl}/team/team-summary-paras/${teamId}`
  ).then(async (res) => {
    const data = await res.json();
    return data.data;
  });
}

async function getLatestScore(teamId) {
  const backendUrl = process.env.BACKEND_URL;
  console.log('backendUrl~~~', backendUrl);
  return await fetch(
    `${backendUrl}/csv/latest5score/${teamId}`
  ).then(async (res) => {
    const data = await res.json();
    return data.data;
  });
}

async function getUserinfo(teamId) {
  return await fetch(`http://18.117.7.255:8080/api/auth/team/${teamId}`).then(
    async (res) => {
      const data = await res.json();
      return data;
    }
  );
}

async function convertSvgToPng(svgContent) {
  return await sharp(Buffer.from(svgContent)).toBuffer();
}

async function renderChart(meetingid) {
  
  const { window } = new JSDOM(html);
  const chart1 = select(window.document).select("#chart1");
  const chart2 = select(window.document).select("#chart2");
  const brainMeter = select(window.document).select("#brain-meter");
  const userName = select(window.document).select("#user-name");
  const teamName = select(window.document).select("#team-name");
  // import chart1.svg and convert to png and append to the DOM in the #chart1 div
  const data = await getData(meetingid);

  const chart1SVG = renderRadarChart(data, false);
  const chart1PNG = await convertSvgToPng(chart1SVG);

  chart1.html(
    `<img
      id="chart1"
      src="data:image/png;charset=utf-8;base64,${chart1PNG.toString("base64")}"
    >`
  );

  const chart2SVG = fs.readFileSync(
    path.resolve(__dirname, "./chart2.svg"),
    "utf8"
  );
  const chart2PNG = await convertSvgToPng(chart2SVG);

  chart2.html(
    `<img
      id="chart2"
      src="data:image/png;charset=utf-8;base64,${chart2PNG.toString("base64")}"
    >`
  );

  const meetingData = await getMeetingDetails(meetingid);

  const [teamSummary, latestScore, userInfo] = await Promise.all([
    getTeamSummary(meetingData.team_id),
    getLatestScore(meetingData.team_id),
    getUserinfo(meetingData.team_id),
  ]);

  let userEmail = '';
  if (userInfo.hasOwnProperty('email')) {
    userEmail = userInfo.email;
  }
  if (userInfo.hasOwnProperty("username")) {
    const usernameParent = select(userName.node().parentNode);
    userName.remove();
    usernameParent.html(
      `Dear <span id="user-name" style="font-weight: 600">${userInfo.username}.</span>`
    );
  }
  if (userInfo.hasOwnProperty("teamName")) {
    const teamNameParent = select(teamName.node().parentNode);
    teamName.remove();
    teamNameParent.html(`Your team
    <span id="team-name" style="color: #00a5ff"
      >${userInfo.teamName}</span
    >
    finished the processing of Meeting
    <span style="color: #00a5ff">${meetingData.meeting_name}</span>
    .`);
  }

  if (teamSummary.hasOwnProperty("score")) {
    const scores = teamSummary.score;
    if (scores.length > 1) {
      const changedScore = scores[1];
      const changedScoreEl = select(window.document).select("#changedScore");
      const changedScoreParent = select(changedScoreEl.node().parentNode);
      changedScoreEl.remove();
      if (changedScore >= 0) {
        changedScoreParent.html(
          `<span id="changedScore">↗ ${Math.abs(
            Math.round(changedScore)
          )}% compared to the last.</span>`
        );
      } else {
        changedScoreParent.html(
          `<span id="changedScore">↘ ${Math.abs(
            Math.round(changedScore)
          )}% compared to the last.</span>`
        );
      }

      const globalScore = scores[0].toFixed(1);
      const globalScoreEl = select(window.document).select("#global-score");
      const globalScoreParent = select(globalScoreEl.node().parentNode);
      globalScoreEl.remove();
      globalScoreParent.html(`<span id="global-score">${globalScore}</span>`);
    }
  }

  if (teamSummary.hasOwnProperty("stress")) {
    const stresses = teamSummary.stress;
    if (stresses.length > 1) {
      const stress = stresses[1];
      const stressEl = select(window.document).select("#stress");
      const stressParent = select(stressEl.node().parentNode);
      stressEl.remove();
      if (stress >= 0) {
        stressParent.html(
          `<span id="stress" style="color: #fc3400">↗ ${Math.abs(
            Math.round(stress)
          )}%</span><br />`
        );
      } else {
        stressParent.html(
          `<span id="stress" style="color: #61ff8d">↘ ${Math.abs(
            Math.round(stress)
          )}%</span><br />`
        );
      }
    }
  }

  if (teamSummary.hasOwnProperty("engagement")) {
    const engagements = teamSummary.engagement;
    if (engagements.length > 1) {
      const engagement = engagements[1];
      const engagementEl = select(window.document).select("#engagement");
      const engagementParent = select(engagementEl.node().parentNode);
      engagementEl.remove();
      if (engagement >= 0) {
        engagementParent.html(
          `<span id="stress" style="color: #61ff8d">↗ ${Math.abs(
            Math.round(engagement)
          )}%</span><br />`
        );
      } else {
        engagementParent.html(
          `<span id="stress" style="color: #fc3400">↘ ${Math.abs(
            Math.round(engagement)
          )}%</span><br />`
        );
      }
    }
  }

  if (teamSummary.hasOwnProperty("alignment")) {
    const alignments = teamSummary.alignment;
    if (alignments.length > 1) {
      const alignment = alignments[1];
      const alignmentEl = select(window.document).select("#alignment");
      const alignmentParent = select(alignmentEl.node().parentNode);
      alignmentEl.remove();
      if (alignment >= 0) {
        alignmentParent.html(
          `<span id="stress" style="color: #61ff8d">↗ ${Math.abs(
            Math.round(alignment)
          )}%</span><br />`
        );
      } else {
        alignmentParent.html(
          `<span id="stress" style="color: #fc3400">↘ ${Math.abs(
            Math.round(alignment)
          )}%</span><br />`
        );
      }
    }
  }

  if (teamSummary.hasOwnProperty("agency")) {
    const agencys = teamSummary.agency;
    if (agencys.length > 1) {
      const agency = agencys[1];
      const agencyEl = select(window.document).select("#agency");
      const agencyParent = select(agencyEl.node().parentNode);
      agencyEl.remove();
      if (agency >= 0) {
        agencyParent.html(
          `<span id="stress" style="color: #61ff8d">↗ ${Math.abs(
            Math.round(agency)
          )}%</span><br />`
        );
      } else {
        agencyParent.html(
          `<span id="stress" style="color: #fc3400">↘ ${Math.abs(
            Math.round(agency)
          )}%</span><br />`
        );
      }
    }
  }

  if (teamSummary.hasOwnProperty("burnout")) {
    const burnouts = teamSummary.burnout;
    if (burnouts.length > 1) {
      const burnout = burnouts[1];
      const burnoutEl = select(window.document).select("#burnout");
      const burnoutParent = select(burnoutEl.node().parentNode);
      burnoutEl.remove();
      if (burnout >= 0) {
        burnoutParent.html(
          `<span id="stress" style="color: #fc3400">↗ ${Math.abs(
            Math.round(burnout)
          )}%</span><br />`
        );
      } else {
        burnoutParent.html(
          `<span id="stress" style="color: #61ff8d">↘ ${Math.abs(
            Math.round(burnout)
          )}%</span><br />`
        );
      }
    }
  }

  if (latestScore.brain_score) {
    const brain_text = select(window.document).select("#brain-text");
    const brainTextParent = select(brain_text.node().parentNode);
    brain_text.remove();
    brainTextParent.html(
      `<span id="brain-text">${latestScore.brain_score.toFixed(1)}%</span>`
    );

    const brain_meter = select(window.document).select("#brain-meter");
    const brainMeterParent = select(brain_meter.node().parentNode);
    brain_meter.remove();
    brainMeterParent.html(
      `<div
      id="brain-meter"
      style="
        width: ${latestScore.brain_score}%;
        height: 5px;
        background-color: #44c9b1;
      "
    ></div>`
    );
  }

  const brainParent = select(brainMeter.node().parentNode);
  brainMeter.remove();
  brainParent.html(
    `<div
    id="brain-meter"
    style="
      width: 75%;
      height: 5px;
      background-color: #fddc65;
    "
  ></div>`
  );

  if (latestScore.body_score) {
    const body_text = select(window.document).select("#body-text");
    const bodyTextParent = select(body_text.node().parentNode);
    body_text.remove();
    bodyTextParent.html(
      `<span id="body-text">${latestScore.body_score.toFixed(1)}%</span>`
    );

    const body_meter = select(window.document).select("#body-meter");
    const bodyMeterParent = select(body_meter.node().parentNode);
    body_meter.remove();
    bodyMeterParent.html(
      `<div
      id="body-meter"
      style="
        width: ${latestScore.body_score}%;
        height: 5px;
        background-color: #44c9b1;
      "
    ></div>`
    );
  }

  if (latestScore.behavior_score) {
    const behavior_text = select(window.document).select("#behavior-text");
    const behaviorTextParent = select(behavior_text.node().parentNode);
    behavior_text.remove();
    behaviorTextParent.html(
      `<span id="behavior-text">${latestScore.behavior_score.toFixed(1)}%</span>`
    );

    const behavior_meter = select(window.document).select("#behavior-meter");
    const behaviorMeterParent = select(behavior_meter.node().parentNode);
    behavior_meter.remove();
    behaviorMeterParent.html(
      `<div
      id="behavior-meter"
      style="
        width: ${latestScore.behavior_score}%;
        height: 5px;
        background-color: #2e6dff;
      "
    ></div>`
    );
  }

  const meeting_button = select(window.document).select("#meeting-button");
  const meetingButtonParent = select(meeting_button.node().parentNode);
  meeting_button.remove();
  meetingButtonParent.html(`
  <a
          id="meeting-button"
          href="https://syneurgy.io/meeting-details/${meetingid}"
          style="
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border: solid 1px white;
            border-radius: 10px;
          "
          >Go to the Meeting</a
        >`);
  return {
    html: new JSDOM(window.document.documentElement.outerHTML).serialize(),
    pngBuffer: chart1PNG,
    pngBuffer2: chart2PNG,
    email: userEmail
  };
}

export default renderChart;
