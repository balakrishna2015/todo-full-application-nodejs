const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const jwt = require("jsonwebtoken");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server start at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error at: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// check
const hasStatusProperty = (objectQuery) => {
  return objectQuery.status !== undefined;
};

const hasPriorityProperty = (objectQuery) => {
  return objectQuery.priority !== undefined;
};

const hasPriorityAndStatus = (objectQuery) => {
  return objectQuery.priority !== undefined && objectQuery.status !== undefined;
};

const hasSearchProperty = (objectQuery) => {
  return objectQuery.search_q !== undefined;
};

const hasCategoryAndStatus = (objectQuery) => {
  return objectQuery.category !== undefined && objectQuery.status !== undefined;
};

const hasCategoryProperty = (objectQuery) => {
  return objectQuery.category !== undefined;
};

const hasCategoryAndPriority = (objectQuery) => {
  return (
    objectQuery.category !== undefined && objectQuery.priority === undefined
  );
};

const responseObjectResult = (requestQuery) => {
  return {
    id: requestQuery.id,
    todo: requestQuery.todo,
    priority: requestQuery.priority,
    status: requestQuery.status,
    category: requestQuery.category,
    dueDate: requestQuery.due_date,
  };
};

// API-1 GET
app.get("/todos/", async (request, response) => {
  let data = null;
  let todoQuery = "";

  const { search_q = "", status, priority, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        todoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(todoQuery);
        response.send(data.map((each) => responseObjectResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority == "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        todoQuery = `
            select * from todo
            where
            priority='${priority}';`;
        data = await db.all(todoQuery);
        response.send(data.map((each) => responseObjectResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todoQuery = `
                select * from todo
                where
                priority='${priority}' and status='${status}';`;
          data = await db.all(todoQuery);
          response.send(data.map((each) => responseObjectResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearchProperty(request.query):
      todoQuery = `
        select * from todo
        where
        todo like "%${search_q}%";`;
      data = await db.all(todoQuery);
      response.send(data.map((each) => responseObjectResult(each)));
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todoQuery = `
                select * from todo
                where
                category='${category}' and status='${status}';`;
          data = await db.all(todoQuery);
          response.send(data.map((each) => responseObjectResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        todoQuery = `
            select * from todo
            where
            category='${category}';`;
        data = await db.all(todoQuery);
        response.send(data.map((each) => responseObjectResult(each)));
      } else {
        response.status(400);
        response("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          todoQuery = `
                select * from todo 
                where
                category='${category}' and priority='${priority}';`;
          data = await db.all(todoQuery);
          response.send(data.map((each) => responseObjectResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      todoQuery = `
        select * from todo;`;
      data = await db.all(todoQuery);
      response.send(data.map((each) => responseObjectResult(each)));
  }
});

// API-2 GET
app.get("/todo/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const data = await db.get(todoQuery);
  response.send(responseObjectResult(data));
});

// API-3 GET
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const todoQuery = `SELECT * FROM todo WHERE due_date ='${newDate}';`;
    const data = await db.all(todoQuery);
    response.send(data.map((each) => responseObjectResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API-4 POST
app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const todoQuery = `INSERT INTO 
                    todo(id, todo, priority, status, category, due_date)
                    VALUES( ${id}, '${todo}','${priority}','${status}','${category}','${newDate}');`;
          const data = await db.run(todoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid todo category");
    }
  } else {
    response.status(400);
    response.send("Invalid todo Status");
  }
});
// API-5 PUT
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  const previousTodoQuery = `
    select * from todo
    where 
    id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  //console.log(previousTodo);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.deue_date,
  } = request.body;
  //console.log(request.body);

  let updateTodoQuery = "";

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
          update todo
          set
          todo='${todo}',
          priority='${priority}',
          status='${status}',
          category='${category}',
          due_date='${dueDate}'
          where 
          id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
              update todo set
              todo='${todo}',
              status='${status}',
              priority='${priority}',
              category='${category}',
              due_date='${dueDate}'
              where
              id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
              update todo set
              todo='${todo}',
              status='${status}',
              priority='${priority}',
              category='${category}',
              due_date='${dueDate}'
              where
              id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            update todo set 
            todo='${todo}',
            status='${status}',
            priority='${priority}',
            category='${category}',
            due_date='${dueDate}'
            where
            id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `update todo set
        todo='${todo}',
        status='${status}',
        priority='${priority}',
        category='${category}',
        due_date='${newDate}'
        where 
        id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API-6 DELETE
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
