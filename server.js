// install dotenv package in order to access config.env
const dotenv = require('dotenv');

// tell express the path of config.env
dotenv.config({ path: './config.env' });

const app = require('./app');

// set the port, one from onfig.env if there is any or 3000
const port = process.env.PORT || 3000;

// start the server here
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
