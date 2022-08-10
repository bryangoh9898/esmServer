var express = require('express');
var router = express.Router();
const Employees = require('../models/employee')
const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');

const upload = multer({ dest: 'tmp/csv/' });
//We see that mongodb is case-sensitive

//CRUD features

//Retrieves a user given ID 
router.get('/:id', function(req,res,next){
  Employees.findOne({"id": req.params.id})
  .then((employee) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(employee);
  }, (err) => next(err))
  .catch((err) => next(err))
});

//Update a user information 
router.put('/:id', function(req,res,next){
      
  //We want to make sure json payload is valid 
  var name = req.body.name;
  var login = req.body.login;
  var salary = req.body.salary; 

  //Validate json payload 
  var validated = validateUserParamsInput(name, login, salary)
  if(validated){
    res.statusCode = 400;
    return res.json({error: validated});
  }

  Employees.findOne({"id": req.params.id})
  .then((employee) => {
    //Check if valid login param
    if(employee == null){
      res.statusCode = 204;
      res.json({error: "No employee found with such ID"})  
      return res
    }

    if(login != employee.login){
      //Do a check to see if this login already existss
      Employees.findOne({"login" : login})
      .then((validEmployee) => {
        if(validEmployee != null){
          res.statusCode = 400;
          res.setHeader('Content-Type' , 'application/json');
          res.json({error: "Login already exists in database"});
          return res
        }

        //Valid payload, now we update our employee data
        employee.name = req.body.name;
        employee.login = req.body.login;
        employee.salary = req.body.salary;
        employee.save().then((savedEmployee) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(savedEmployee)
        }, (err) => next(err))  
        .catch((err) => next(err)) 
      }, (err) => next(err))
      .catch((err) => next(err))
    }
    else{
      //Valid payload, now we update our employee data
      employee.name = req.body.name;
      employee.login = req.body.login;
      employee.salary = req.body.salary;
      employee.save().then((savedEmployee) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(savedEmployee)
      }, (err) => next(err))  
      .catch((err) => next(err)) 
    }
 
  }, (err) => next(err))
  .catch((err) => next(err))

})

//Delete a user
router.delete('/:id', function(req,res,next) {
  Employees.deleteOne({"id": req.params.id})
  .then(() => {
    res.statusCode = 200;
    res.setHeader('Content-Type' , 'application/json');
    res.json("Successful");
  }, (err) => next(err))
  .catch((err) => next(err))
})


//Retrieves the list of 30 users with sort and filter conditions
router.get('/', function(req, res, next) {

  var minSalaryInput = req.query.minSalary;
  var maxSalaryInput = req.query.maxSalary;
  var offset = req.query.offset;
  var limit = req.query.limit;
  var sortCondition = req.query.sort;

  //We want to decode sortCondition
  sortCondition = decodeURIComponent(sortCondition);

  //Validation Check for the params - If any params is missing, return 400
  var validatedParams = validateParamsInput(minSalaryInput, maxSalaryInput, offset, limit, sortCondition);
  if(validatedParams){
    res.statusCode = 400;
    return res.json({error: validatedParams});
  }

  //Preprocess params sortfield & salary
  var sortField = parseSortCondition(sortCondition);
  var salaryField = {
    salary: {
      $gte: minSalaryInput, 
      $lte: maxSalaryInput}
  }

  //Retrieves and return users who satisfy search conditions
  Employees.find(salaryField)
  .sort(sortField).limit(limit).skip(offset)
  .then((employeeRecord) => {
    console.log(employeeRecord)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(employeeRecord);
  }, (err) => next(err))
  .catch((err) => next(err))

});

//Post a new user
router.post('/', function(req, res, next){
    //Check if the id for new user passed in is already in database
    // Employees.findOne({"id": req.body.id})
    Employees.findOne({$or: [
      {"id": req.body.id},
      {"login": req.body.login}
    ]})
    .then((employee) => { 

      if(employee != null){
        res.statusCode = 400;
        res.setHeader('Content-Type' , 'application/json');
        res.json("UserID/Login already exists in database");
        return res
      }

        //Validate json payload 
        var validated = validateUserParamsInput(req.body.name, req.body.login, req.body.salary)
        if(validated){
          res.statusCode = 400;
          return res.json({error: validated});
        }

        Employees.create({
          id: req.body.id,
          login: req.body.login,
          name: req.body.name,
          salary: req.body.salary
        })
        .then((newEmployee) => {
          res.statusCode = 200;
          res.setHeader('Content-Type' , 'application/json');
          res.json(newEmployee);
        }, (err) => next(err))
        .catch((err) => next(err))
      //})


    }, (err) => next(err))
    .catch((err) => next(err))
    

})

//Retrieves all the records
router.get('/employeeRecords', function(req,res,next){
  Employees.find({})
  .then((employeeRecord) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(employeeRecord);
  }, (err) => next(err))
  .catch((err) => next(err))
});

//Retrieves count of all the records 
router.get('/employeeRecords/count', function(req,res,next){
  var salaryField = {
    salary: {
      $gte: req.query.minSalary, 
      $lte: req.query.maxSalary}
  }
  
  Employees.countDocuments(salaryField)
  .then((count)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(count);
  }, (err) => next(err))
  .catch((err) => next(err))
});

//Delete all of employee records
router.delete('/', function(req,res,next){
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

    //We do our operation and update to db here
    Employees.bulkWrite(bulkRecords)
    .then((docs) => {
      console.log("Saved into db successfully");
      res.statusCode = 200;
      res.setHeader('Content-Type' , 'application/json');
      res.json(docs);
      return res
    }, (err) => next(err))
    .catch((err) => {
      next(err);
    });

  })

});


//------------------Helper & Validation Functions-----------------//

function parseSortCondition(sortCondition){
    //Parse sort to see if it's asc or desc
    var operator = ""; 
    if(sortCondition[0] == '-'){ //desc
      operator = "desc";
    }
    else {
      operator = "asc";
    }
  
    var sortField = {};
  
    if(sortCondition.substring(1, sortCondition.length) == "id"){
      sortField["_id"] = operator;
    }
    else{
      sortField[sortCondition.substring(1, sortCondition.length)] = operator;
    }
    return sortField;
}

function validateUserParamsInput(name, login, salary){
  if(name == ""){
    return "Error! Name params is empty"
  }

  if(login == ""){
    return "Error! Login params is empty"
  }

  if(isNaN(salary)){
    return "Error! Invalid Salary"
  }

  return

}

function validateParamsInput(minSalary, maxSalary, offset, limit, sort){

  if(minSalary == "" || maxSalary == ""){
    return "Error! Salary params is empty";
  }

  if(offset == ""){
    return "Error! Offset params is empty";
  }

  if(limit == ""){
    return "Error! Limit Offset is empty";
  }

  if(sort == ""){
    return "Error! Sort is empty"; 
  }

  //Validate that salary is valid 
  if(isNaN(minSalary) || isNaN(maxSalary)){
    return "Error! Invalid Salary Params"
  }

  //Validate that offset & limit is valid 
  if(isNaN(offset) || isNaN(limit)){
    return "Error! Invalid offset/limit passed"
  }
  
  //Validate sort is +id/name/login/salary
  //Validate first portion is + or - 
  if(sort[0] != '+' && sort[0] != '-'){
    return "Error! Invalid Sort format"
  }
  else{
    //Check if it's a NaN 
    var tempArray = ["id", "name", "login", "salary"];
    var temp = sort.substring(1, sort.length);
    if(!tempArray.includes(temp.toLowerCase())){
      return "Error! Invalid Sort format"
    }
  }

  return ;
}

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

  //We validate that there are only 4 column headers
  if(rows.length == 0){
    return "Empty File Uploaded"
  }

  var error = validateHeader(rows[0]);

  if(error){
    return error
  }

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

function validateHeader(row){

  if(row.length == 0){
    return "Empty File Uploaded"
  }

  if(row.length > 4){
    return "Number of headers: " + row[0].length + ". Too many column headers. There should only be 4!"
  }
  if(row.length < 4){
    return "Number of headers: " + row[0].length + ". Too little column headers. There should only be 4!"
  }

  for( var i = 0 ; i < row.length; i ++){
    if(row[i] == ''){
      return "Column header " + (++i) + " is Empty"
    }
  }
}

function validateRow(row, ids, login){
  //Check if it's a comment, if comment, ignore the row and return as per usual
  tempFirstCellStr = row[0]
  if(tempFirstCellStr[0] == '#'){
    return "Comment"
  }

  //We should only have exactly 4 columns
  if(row.length > 4 || row.length < 4){
    return "There are " + row.length + " columns, csv file should only contain 4!"
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
