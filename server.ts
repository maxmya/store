import 'zone.js/dist/zone-node';
import 'reflect-metadata';
import { enableProdMode } from '@angular/core';

import * as express from 'express';
import { join } from 'path';
import * as routeCache from 'route-cache';
import * as jwtExpress from 'express-jwt';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as session from 'express-session';
import * as cors from 'cors';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Config
const CONFIG_FOLDER = join(process.cwd(), 'config');
const config = require(join(CONFIG_FOLDER, 'amazon.json'));

// Express server
const app = express().disable('x-powered-by').use(cookieParser());

// Basic express session
app.use(
  session({
    secret: config.session.secret,
    saveUninitialized: false,
    resave: true
  })
);

// For jwt token errors
app.use((err, req, res, next) => {
  if (err.name === 'StatusError') {
    res.send(err.status, err.message);
  } else {
    next(err);
  }
});

const jwtCheck = jwtExpress({
  secret: config.jwt.secret,
  getToken: (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies && req.cookies.SIO_SESSION) {
      return req.cookies.SIO_SESSION;
    }
    return null;
  },
});

const SERVER_FOLDER = join(process.cwd(), 'server');
const routes = require(join(SERVER_FOLDER, 'routes.js'));
const insertions = require(join(SERVER_FOLDER, 'new-insert'));
const authentication = require(join(SERVER_FOLDER, 'authentication.js'));
const PORT = process.env.PORT || 3000;
const DIST_FOLDER = join(process.cwd(), 'dist');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./server/main');

// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  'html',
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(compress());

// check jwt token for these routes
app.use('/api/user', jwtCheck);

// Authentication routes for local, google and facebook
app.use('/auth', authentication());

/* - Express Rest API endpoints - */
app.get('/api/customer', routes.getCustomer);
app.get('/api/shop/:page', routeCache.cacheSeconds(20), routes.getAllProducts); // Cache 20 seconds
app.get(
  '/api/product/:productId',
  routeCache.cacheSeconds(86400),
  routes.getProductById
); // Cache 24 hours
app.get('/api/user/cart', routes.getFromCart);
app.get('/api/user/cart/count', routes.getCartCount);
app.get('/api/user/checkout', routes.getCheckoutInfo);
app.get('/api/user/orders', routes.getUserOrders);
app.get('/api/user/order/:id', routes.getOrderById);
app.get('/api/user/settings', routes.getUserInfo);
app.delete('/api/user/cart/remove/:id', routes.removeFromCart);
app.post('/api/user/checkout/confirm', routes.checkoutConfirm);
app.post('/api/user/cart/add', routes.addToCart);
app.post('/api/user/update', routes.updateProfile);
app.post('/api/user/laptop', insertions.newLaptop);

// Server static files from /browser
app.get(
  '*.*',
  express.static(join(DIST_FOLDER, 'browser'), {
    maxAge: '1y'
  })
);

// ALl regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req, res });
});

// For jwt token errors
app.use((err, req, res, next) => {
  // eslint-disable-line
  if (err.name === 'UnauthorizedError') {
    res.status(401).send(err.inner);
  }
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
