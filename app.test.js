// import request from 'supertest';
var request = require('supertest');
var app = require('./app');


describe("GET /users/employeeRecords/count", () => {
    describe("retrieval of data", () => {

        test("should respond with a 200 status code", async () => {
            const response = await request(app).get("/users/employeeRecords/count")
            // .send({
            //   username: "userna  me",    
            //   password: "password"
            // })   
            expect(response.statusCode).toBe(200)
          })
    })
})
