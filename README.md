# Express Emailer with Dynamic D3 Chart Rendering

This repository provides a web application that serves a dual purpose: It renders dynamic D3 charts based on a provided `meetingid` query parameter and then sends these charts as inline images in an email.

## Installation

Clone the repository and navigate to the root directory. Install the necessary dependencies using:

```bash
npm install
```

## Configuration

This project uses environment variables to store configuration settings. To configure the environment variables, create a new file in the root directory of your project called `.env`. In the `.env` file, add your environment variables in the format `NAME=VALUE`. For example:

```bash
EMAIL = test@tes.com
PASSWORD = test
```

## Usage

To start the server, run the following command:

```bash
npm start
```

Then, open your web browser and navigate to `http://localhost:3000`.

## Testing

To run the unit tests, run the following command:

```bash
npm test
```

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
