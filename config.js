const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

const users = new Map();
const sessions = new Map();

module.exports = { app, users, sessions };