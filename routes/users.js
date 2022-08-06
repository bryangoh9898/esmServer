var express = require('express');
var router = express.Router();
// const fileupload = require('express-fileupload');
const Employees = require('../models/employee')

//New stuff needed
const http = require('http');
const fs = require('fs');

const multer = require('multer');
const csv = require('fast-csv');
const { Model } = require('mongoose');
//We will use this to acccept /users/upload

const upload = multer({ dest: 'tmp/csv/' });

//We see that mongodb is case-sensitive

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/employeeRecords', function(req,res,next){
  Employees.find({})
  .then((employeeRecord) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(employeeRecord);
  })
})

router.delete('/employeeRecords', function(req,res,next){
  Employees.deleteMany({})
  .then(() => {
      res.statusCode = 200;
      res.setHeader('Content-Type' , 'application/json');
      res.json("Successful");
  }, (err) => next(err))
  .catch((err) => next(err))
});

router.post('/upload', upload.single('emplist'), async function(req,res,next) {
  //We will being by accepting the csv file here
  const fileRows = [];
  await csv.parseFile(req.file.path)
  .on("data", function(data){
    fileRows.push(data)
  })
  .on("end", function(){

    fs.unlinkSync(req.file.path);

    const validationError = validateEmployeeDetails(fileRows)

    if(validationError){
      //Returns bad request due to something that is perceived as a client error 
      res.statusCode = 400;
      return res.json({error: validationError});
    }

    //Now we want to save changes into database
    //We parse each row into a json objkect
    var EmployeesRecords = parseEmployeeRecords(fileRows);

    const bulkRecords = EmployeesRecords.map(fileRow => ({
      updateOne: {
        filter: {id: fileRow["id"]},
        update: fileRow,
        upsert: true,
      }
    }));
    Employees.bulkWrite(bulkRecords)
    .then((docs) => {
      console.log("Saved into db successfully");
      res.statusCode = 200;
      res.setHeader('Content-Type' , 'application/json');
      res.json(docs);
    }, (err) => next(err))
    .catch((err) => {
      next(err);
    } );

  })
  //Then save into database
});

function parseEmployeeRecords(fileRows){
  var EmployeesRecords = [];
  for(var i = 1; i < fileRows.length; i++){
    tempFirstCellStr = fileRows[i][0]
    if(tempFirstCellStr[0] == '#'){
      continue
    }
    var tempJson = {};
    tempJson["id"] = fileRows[i][0].toLowerCase();
    tempJson["login"] = fileRows[i][1].toLowerCase();
    tempJson["name"] = fileRows[i][2].toLowerCase();
    tempJson["salary"] = fileRows[i][3];
    EmployeesRecords.push(tempJson);
  }
  return EmployeesRecords;
}

function validateEmployeeDetails(rows){
  //ID and login must be unique, should not be repeated - We should caps everything and make comparison
  ids = []
  login = []
  //We ignore the header row (first row)
  for(var i = 1 ; i < rows.length; i++ ){
    const validatedRow = validateRow(rows[i], ids, login);
    if(validatedRow == "Comment"){
      continue
    }
    if(validatedRow){
      return "Invalid Row " + i + ": " + validatedRow;
    }
    //We update id and login array
    ids.push(rows[i][0].toLowerCase())
    login.push(rows[i][1].toLowerCase())
  }
  return ;
}

function validateRow(row, ids, login){
  //We should only have exactly 4 columns
  if(row.length > 4 || row.length < 4){
    return "There are " + row.length + " columns, csv file should only contain 4!"
  }

  //Check if it's a comment, if comment, ignore the row and return as per usual
  tempFirstCellStr = row[0]
  if(tempFirstCellStr[0] == '#'){
    return "Comment"
  }

  //All 4 columns must be filled
  for(var i = 0; i < row.length; i++){
    if(row[i] == ''){
      errorColumn = ""
      switch(i){
        case 0: 
          errorColumn = "ID";
          break; 
        case 1: 
          errorColumn = "Login";
          break;
        case 2: 
          errorColumn = "Name";
          break;
        case 3:
          errorColumn = "Salary";
          break;
        default: 
          break;
      }
      return errorColumn + " Column" + " is not filled"
    }

    if(i == 0){
      //Check if id already exists in excel file
      if(ids.includes(row[i].toLowerCase())){
        return "Duplicate ID exists for " + row[i]
      }
    }

    if(i == 1){
      if(login.includes(row[i].toLowerCase())){
        return "Duplicate Login Name exists for " + row[i]
      }
    }

    if(i == 3){
      //Check if salary input is >= 0.0
      if(isNaN(row[i])){
        return "Invalid Salary Input" + row[i]
      }
      if(row[i] < 0){
        return "Negative Salary Input is not allowed"
      }

    }

  }

  return 

}


module.exports = router;
