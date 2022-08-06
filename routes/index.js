var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employees = require('../models/employee')



/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("test")
  Employees.find({}).then((employees) => {
    console.log(employees)
  })
  res.render('index', { title: 'Express' });
});

module.exports = router;
