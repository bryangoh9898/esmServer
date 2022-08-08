var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employees = require('../models/employee')



/* GET home page. */
router.get('/', function(req, res, next) {
  Employees.find({}).then((employees) => {
    console.log(employees)
  })
  res.render('index', { title: 'ESTL Take Home Assessment' });
});

module.exports = router;
