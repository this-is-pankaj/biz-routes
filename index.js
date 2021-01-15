const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require(`./config/${process.env.Node_ENV || 'local'}`);

const routes = require('./routes');
const getUserId = require('./utils/getUserId');
const gstinDetails = require('./interface/gstin.interface');

const http = require('http').Server(app);
const port = config.port;
mongoose.Promise = global.Promise;

const component = "index";

const options = {
	useNewUrlParser: true,
	// autoIndex: false, // Don't build indexes
	// reconnectTries: 100, // Never stop trying to reconnect
	// reconnectInterval: 500, // Reconnect every 500ms
	poolSize: 10, // Maintain up to 10 socket connections
	// If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  useUnifiedTopology: true
};

const corsOptions = {
  exposedHeaders: ['App-user-id', 'App-session-id', 'App-token-expiry'],
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

mongoose.connect(config.connectionString, options)
  .then(() => {
    console.log('Database is connected');
  })
  .catch((err) => { 
    console.log(`Can not connect to the database ${err}`);
  });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors(corsOptions));

app.use('/api/auth', getUserId, routes.authRouter);
app.use('/api/user/profiles', getUserId, routes.profileRouter);
app.use('/api/gstinInfo', getUserId, gstinDetails.getCompanyInfo);

http.listen(port, ()=>{
    console.log("Server up and running on port ", port);
});