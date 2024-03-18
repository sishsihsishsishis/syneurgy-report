import renderChart from "./renderD3.js";
import nodemailer from "nodemailer";
import { jest } from "@jest/globals";

// Your server code would ideally be modularized into its own file
// For now, assume we're importing your server function, e.g., app.get("/chart")
// If it's not modularized, you'll have to refactor for effective unit testing

describe("Server", () => {
  afterEach(() => {
    jest.restoreAllMocks(); // Reset all mocks after each test
  });

  it("should send an email with the rendered chart", async () => {
    const req = { query: { meetingid: 123 } };
    const res = { send: jest.fn() };
    const mockRender = {
      html: "<div>test</div>",
      pngBuffer: Buffer.from("test"),
      pngBuffer2: Buffer.from("test2"),
    };

    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ response: "Test response" }),
    });
    jest.spyOn(renderChart, "default").mockResolvedValue(mockRender);

    // Assuming the route is available as a function
    await app.get("/chart")(req, res);

    expect(res.send).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
    expect(
      nodemailer.createTransport().sendMail.mock.calls[0][0].attachments.length
    ).toEqual(2);
  });

  it("should handle email sending error", async () => {
    const req = { query: { meetingid: 123 } };
    const res = { send: jest.fn() };
    const mockRender = {
      html: "<div>test</div>",
      pngBuffer: Buffer.from("test"),
      pngBuffer2: Buffer.from("test2"),
    };

    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error("Test error")),
    });
    jest.spyOn(renderChart, "default").mockResolvedValue(mockRender);

    await app.get("/chart")(req, res);

    expect(res.send).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
  });
});
