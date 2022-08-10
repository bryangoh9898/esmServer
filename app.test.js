var request = require('supertest');
var app = require('./app');

describe("POST /users/upload", () => {
    describe("upload valid data", () => {
        test("upload valid data without comments - 200 response ", async () => {
            const filePath = `${__dirname}/testFiles/validTestData/employeeList.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(200)
        })

        test("upload with comments - 200 response", async() => {
            const filePath = `${__dirname}/testFiles/validTestData/employeeListComments.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(200)
        })

    })

    describe("upload empty file", () => {
        test("upload empty file - 400 reponse", async () => {
            const filePath = `${__dirname}/testFiles/invalidEmptyTestData/employeeListEmpty.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })
    })

    describe("upload missing column header", () =>{
        test("upload 3 column header - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidColHeaderTestData/employeeListLessThan4Headers.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })

        test("upload 5 column header - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidColHeaderTestData/employeeListMoreThan4Headers.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })
    })

    describe("upload of file with partial number of rows with incorrect columns", () => {
        test("upload of file with partial num roles with less than 4 columns - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidColTestData/employeeListLessThan4Col.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })

        test("upload of file with partial num roles with more than 4 columns - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidColTestData/employeeListMoreThan4Col.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })

    })

    describe("upload of file with invalid salary", () => {
        test("upload of file with incorrect salary format - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidSalaryTestData/employeeListIncorrectSalary.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })
        
        test("upload of file with salary < 0 - 400 response", async() => {
            const filePath = `${__dirname}/testFiles/invalidSalaryTestData/employeeListNegativeSalary.csv`
            const response = await request(app).post("/users/upload").attach('emplist', filePath)
            expect(response.statusCode).toBe(400)
        })

    })


})

//Test file used to populate database to retrieve data is employeeList.csv
describe("GET /users", () => {
    describe("retrieve with valid params ", () => {
        test("retrieve with all and valid params with all salary retrieved within range( 0 < Salary <= 4000) - 200 response", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=4000&offset=0&limit=30&sort=%2Blogin")
            var temp = response.body 
            expect(response.statusCode).toBe(200)
            for(var i ; i < temp.length; i++){
                expect(response.body[i][salary]).toBeGreaterThanOrEqual(0)
                expect(response.body[i][salary]).toBeLessThanOrEqual(4000)
            }
        })

        test("retrieve with all and valid params with limit of 30 documents - 200 response", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=4000&offset=0&limit=30&sort=%2Blogin")
            var temp = response.body 
            expect(temp.length).toBeLessThanOrEqual(30)
            expect(response.statusCode).toBe(200)
        })

    })

    describe("retrieve with missing params", () => {
        test("retrieve with missing params - minSalary", async () => {
            const response = await request(app).get("/users?minSalary=&maxSalary=4000&offset=0&limit=30&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with missing params - maxSalary", async () => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=&offset=0&limit=30&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with missing params - offset", async () => {
            const response = await request(app).get("/users?minSalary=0&maxSalary4000=&offset=&limit=30&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with missing params - limit", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary4000=&offset=0&limit=&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with missing params - sort ", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary4000=&offset=0&limit=30&sort=")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with all missing params", async() => {
            const response = await request(app).get("/users?minSalary=&maxSalary=&offset=&limit=&sort=")
            expect(response.statusCode).toBe(400)
        })


    })

    describe("retrieve with invalid data format", () => {
        
        test("retrieve with non numerical min Salary", async() => {
            const response = await request(app).get("/users?minSalary=a123&maxSalary=4000&offset=0&limit=30&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with non numerical max Salary", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=abc123&offset=0&limit=30&sort=%2Blogin")
            expect(response.statusCode).toBe(400)
        })

        test("retrieve with invalid sort field", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=abc123&offset=0&limit=30&sort=%2BloginFail")
            expect(response.statusCode).toBe(400)
        })

        test("retrive without asc/desc for sort field", async() => {
            const response = await request(app).get("/users?minSalary=0&maxSalary=abc123&offset=0&limit=30&sort=login")
            expect(response.statusCode).toBe(400)
        })

    })


})


describe("GET /users/employeeRecords/count", () => {
    describe("retrieval of data", () => {
        test("should respond with a 200 status code", async () => {
            const response = await request(app).get("/users/employeeRecords/count?maxSalary=1000&minSalary=1")
            expect(response.statusCode).toBe(200)
          })

    })
})
