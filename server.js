const inquirer = require('inquirer');
const { Pool } = require('pg');
require("dotenv").config();
const PORT = process.env.PORT || 3001;

const pool = new Pool(
    {
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: "localhost",
        port: 5432,
    },
    console.log(`Connected to the employee_db database.`)
);

pool.connect();




class OptionsMenu {
    run() {
        return inquirer.prompt([
            {
                type: "list",
                message: "What would you like to do?",
                name: "options",
                choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", "Add an employee", "Remove an employee", "Update an employee role", "Update an employee's manager", "Quit"],
            },
        ])
            .then(({ options }) => {
                switch (options) {
                    case "View all departments":
                        viewAllDepartments();
                        break;
                    case "View all roles":
                        viewAllRoles();
                        break;
                    case "View all employees":
                        viewAllEmployees();
                        break;
                    case "Add a department":
                        addDepartment();
                        break;
                    case "Add a role":
                        addRole();
                        break;
                    case "Add an employee":
                        addEmployee();
                        break;
                    case "Update an employee role":
                        updateEmployeeRole();
                        break;
                    case "Remove an employee":
                        removeEmployee();
                        break;
                    case "Update an employee's manager":
                        updateEmployeeMgr();
                        break;
                    default:
                        // default = quit
                        console.log('Exiting the program...');
                        process.exit(0);
                        break;
                }
            })
    }
}

new OptionsMenu().run()

function viewAllDepartments() {
    pool.query(`SELECT * FROM department`, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.table(res.rows);
        }
        new OptionsMenu().run()
    });
}

function viewAllRoles() {
    pool.query(`SELECT role.id AS id, role.title AS title, department.dept_name AS department, role.salary AS salary FROM role JOIN department ON role.dept_id = department.id`, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.table(res.rows);
        }
        new OptionsMenu().run()
    });
}

function viewAllEmployees() {
    pool.query(`SELECT employee.id AS id, employee.first_name AS first_name, employee.last_name AS last_name, role.title AS title, role.salary AS salary, employee.manager_id AS manager FROM employee JOIN role ON employee.role_id = role.id`, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.table(res.rows);
        }
        new OptionsMenu().run()
    });
}

function addDepartment() {
    inquirer.prompt([{
        type: "input",
        message: "What is the name of the department",
        name: "departmentName"
    }])
        .then(answer => {
            pool.query(`INSERT INTO department (dept_name) VALUES ('${answer.departmentName}')`, (err, res) => {
                viewAllDepartments()
            })
        })
}

function addRole() {
    pool.query("SELECT id AS value, dept_name AS name FROM department", (err, data) => {
        inquirer.prompt([
            {
                type: "input",
                message: "What is the name of the role",
                name: "roleName"
            },
            {
                type: "input",
                message: "What is the salary of the role",
                name: "roleSalary"
            },
            {
                type: "list",
                message: "Which department does the role belong to?",
                name: "dept_id",
                choices: data.rows
            }
        ])
            .then(answer => {
                pool.query(`INSERT INTO role (title, salary, dept_id) VALUES ('${answer.roleName}', '${answer.roleSalary}', ${answer.dept_id})`, (err, res) => {
                    viewAllRoles()
                })
            })
    })
}

function addEmployee() {
    pool.query("SELECT id AS value, title AS name FROM role", (err, data) => {
        pool.query("SELECT id AS value, first_name || ' ' || last_name AS name FROM employee", (err, mgrData) => {
            inquirer.prompt([
                {
                    type: "input",
                    message: "What is the employee's first name?",
                    name: "employeeFirstName"
                },
                {
                    type: "input",
                    message: "What is the employee's last name?",
                    name: "employeeLastName"
                },
                {
                    type: "list",
                    message: "What is the employee's role?",
                    name: "role_id",
                    choices: data.rows,
                },
                {
                    type: "list",
                    message: "Who is the employee's manager?",
                    name: "manager_id",
                    choices: mgrData.rows,
                    // list employees
                }
            ])
                .then(answer => {
                    console.log(answer);
                    pool.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${answer.employeeFirstName}', '${answer.employeeLastName}', ${answer.role_id}, ${answer.manager_id})`, (err, res) => {
                        if (err) console.log(err);
                        viewAllEmployees()
                    })
                })
        })
    })
}

function updateEmployeeRole() {
    pool.query("SELECT id AS value, first_name || ' ' || last_name AS name FROM employee", (err, data) => {
        pool.query("SELECT id AS value, title AS name FROM role", (err, roleData) => {
            inquirer.prompt([
                {
                    type: "list",
                    message: "Which employee's role do you want to update?",
                    name: "id",
                    choices: data.rows
                    // list employees
                },
                {
                    type: "list",
                    message: "Which role do you want to assign the selected employee?",
                    name: "role_id",
                    choices: roleData.rows
                    // list roles
                }
            ])
                .then(answer => {
                    pool.query(`UPDATE employee SET role_id=${answer.role_id} WHERE id = ${answer.id}`, (err, res) => {
                        viewAllEmployees();
                    })
                })
        })
    })
}

function updateEmployeeMgr() {
    pool.query("SELECT id AS value, first_name || ' ' || last_name AS name FROM employee", (err, data) => {
            inquirer.prompt([
                {
                    type: "list",
                    message: "Which employee's manager do you want to update?",
                    name: "id",
                    choices: data.rows
                    // list employees
                },
                {
                    type: "list",
                    message: "Which manager do you want to assign to the selected employee?",
                    name: "managerId",
                    choices: data.rows
                    // list employees
                }
            ])
                .then(answer => {
                    pool.query(`UPDATE employee SET manager_id=${answer.managerId} WHERE id = ${answer.id}`, (err, res) => {
                        viewAllEmployees();
                    })
                })
        })
    }


function removeEmployee() {
    pool.query("SELECT id AS value, first_name || ' ' || last_name AS name FROM employee", (err, data) => {
        inquirer.prompt([
            {
                type: "list",
                message: "Which employee do you want to remove?",
                name: "id",
                choices: data.rows
                // list employees
            }
        ])
        .then(answer => {
            pool.query(`DELETE FROM employee WHERE id = ${answer.id}`), (err, res) => {
                viewAllEmployees();
            }
        })
    })
}





