const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    login:{
        type: String,
        required: true,
        unique: true
    },
    name:{
        type: String,
        required: true
    },
    salary:{
        type: Number,
        required: true
    }
},{
    timestamps: true
});



var Employees = mongoose.model('employee' , EmployeeSchema);

module.exports = Employees;