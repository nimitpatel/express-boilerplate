// Environment variables
require(`dotenv`).config({path: `process.env`});

// Requiring packages
const express = require(`express`),
    app = express(),
    morgan = require(`morgan`),
    bodyParser = require(`body-parser`),
    mongoose = require(`mongoose`),
    session = require(`express-session`),
    flash = require(`connect-flash`),
    MongoStore = require(`connect-mongo`)(session),
    passport = require(`passport`);


// DB setup
require(`./config/mongoose`);


// Passport Configuration
require(`./config/passport`);


// App setup
app.set(`view engine`, `ejs`);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + `/public`));
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 3 * 24 * 60 * 60 // 3 days
    }),
    cookie: {maxAge: 2 * 24 * 60 * 60 * 1000} // 3 days
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

if(process.env.MODE.toLowerCase() === `dev`){
    app.use(morgan(':method :url - :status - :response-time ms')); // logging http activity
}


// Routes
const routes = require(`./routes/_all`);
app.use(routes);


// Hiding errors if in production mode
if(process.env.MODE === `prod`){
    app.use((err, req, res, next) => {
        console.log(err);
        const stack = null;
        const type = req.get(`content-type`);
        const status = err.status || 500;
        const message = status === 404 ? err.message : `Oops! Something is wrong`;
    
        if (type && type.toLowerCase().includes(`json`)) {
            return res.status(status).json({ errors: [{ msg: message, stack }] });
        }
        else{
            return res.render(`error`, {
                docTitle: `Page Not Found`,
            });
        }
    });
}


// Server setup
app.listen(process.env.PORT, () => { console.log(`Server listening on ${process.env.PORT}`); });