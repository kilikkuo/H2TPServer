Prototype: Backoffice Task Manager
==================================

Overview
--------

task.py:

 * Handling a HTTP request is treated as executing a task and the task is created
   according to the 'action' field from URL, see |create_task|.
 * Each task is acomplished once it got the specific event from its operator.
 * A task contains:

   * Operator : the user who is going to perform the action.
   * Timestamp : the time when the task is created.
   * Data : the reset of the parameters which will be used later.

taskcenter.py:
 
 * It's the first-stop where the parameters from URL are parsed and tasks are
   generated.
 * A worker thread is created to execute the task asynchonously.
 * It shall send execution result to the web page for display if needed. 

user.py:

 * Define behaviors which are permitted for different roles {Admin,Compliance,Service}.
 * Each role needs to prepare the sql statment for its operation.
 * Each role is responsible for invoking a specific event to task when the
   operation is done.

usercenter.py:

 * Create existing Admin/Compliance/Service users according to the data loaded
   from database.
 * Responsible for identifyinig whether the user is authenticated or not.

dbtask.py:
 
 * Define task classes which are the actual places that execute sql statement
   through psycopg2 module.

infocenter.py:

 * Connect to database and trigger task to load data into memory.
 * Prepare DB task which is supposed to perform the sql statement.
 * Manage current pending reviews/inquiries in memory.


error.py

 * Define the error code & translated message.

Generate sample data
------------

Fake database and initial fake data will be created when the server is up by
calling |create_fake_database| in ./tests/fakedata.py. Old database will be dropped
and a new one is created.

To generate sample data via Admin API. After server is up, try calling
|create_samples_v1| in ./tests/create_data_by_adminapi.py


Note on design choices
----------------

I want to make the HTTP API call respond as soon as possible. So I did not
design any API which will get huge result back directly. An asynchronous task
will be generated and executed in worker thread once an API call hits the server.

The result of each task shall be sent to client via websocket for display, but 
this is not implemented yet.

New type of task could be easily implemented by providing a new class which is
derived from task.BasicTask. Also a new method with sql operation should be
implemented in corresponding operator (user) to fulfill this functionality.

General-purpose task/taskthread helper classes are introduced to build background
workers for each center who needs to do thing asynchronously.

The Eventloop/EventHandler helper classes are introduced to loose the relationship
among these centers, so that all operations could be event-driven.

InfoCenter's API |exec_db_task| is able to be executed synchronously or 
asynchronously and can be configured by each Admin/Compliance/Service.
Because normally the sql operation is already performed on taskcenter's
worker thread.

There will be two parts for testing.

1. system-wide test : a bunch of tasks will be executed in a sequnce and the
   task result log will be dumpped and compared to a validation file. This is
   used to check if the system works as expectation.

2. module-wide test : prepare sample test data for each component, i.e. infoCenter,
   taskCenter, userCenter. This is used to check each module works fine.


How to run test
------------

**System-wide test (two ways)**:

1. Send http request by Postman (a chrome extension). Then check the log and make
   you eye bleed. I've generated some sample requests and published here[1].

   (will be expired in 7 days.)

   [1] https://documenter.getpostman.com/view/4096234/emq/RVu7D7xc

2. Run a pre-defined sequence scripts to test the system & validate the results.

   Start the server with test-mode enabled
```
$> python ./app.py True
```
   
   Then run the script, task result log will be dumpped and be compared to 
   test_validation.txt
```
$> python ./tests/test_script.py
```

**Module-wide test**:

 * Not implemented yet.


API
---

The API is currently designed as a POST request with raw JSON body.

The information of actual action is encapsulated in the JSON object.

e.g.
```
  POST /api/v1 HTTP/1.1
  Host: localhost:5000
  Content-Type: application/json
  Cache-Control: no-cache
  Postman-Token: 9813c379-c29d-e923-da16-d0c203427762

  {"token":"78ui","task": {"action":"respond_inquiry","data":{"id":1, "answer":" OK", "closed":true}}}
```

The json object must contain the following 4 keys and corresponding values.

  - "token"  : the identifier for user.
  - "task"   : the required parameter for this task which client wants to execute.
  - "action" : the action that this task will perform.
  - "data"   : required parameters for this action. These parameters may be obtained from the result of previous action and shall be stored by the web page.

Try example APIs by python script as follows,
e.g. 
``` python
import requests
# Need to log in first
r = requests.post('http://localhost:5000/api/v1', json={"token":"12qw","task": {"action":"login","name":"Alice"}})
print(r.status_code)

# Get transfer (id=3)
r = requests.post('http://localhost:5000/api/v1', json={"token":"12qw","task": {"action":"get_transfer", "data": {"id":3}}})
print(r.status_code)
```

**Everyone**:

 * To get customer:
  ``` json
    "action" : "get_customer"
    "data"   : {"id" : The id field in table customer}
  ```

 * To get document:
``` json
    "action" : "get_document"
    "data"   : {"id" : The id field in table document}
```

 * **To get transfer:
``` json
    "action" : "get_transfer"
    "data"   : {"id" : The id field in table transfer}
```

**Admin**:

 * To create customer:
``` json
    "action" : "create_customer"
    "data"   : {"name": The customer's name}
```

 * To create document:
``` json
    "action" : "create_document"
    "data"   : {"cid"    : The customer_id which references to customer(id),
                "content": The content of this document,
                "level"(optional) : The required level to review this document}
```

 * To create transfer:
``` json
    "action" : "create_transfer"
    "data"   : {"cid"    : The customer_id which references to customer(id),
                "amount" : The amount of money,
                "level"(optional) : The required level to review this transfer}
```

 * To create customer inquiry:
``` json
    "action" : "create_inquiry"
    "data"   : {"cid"     : The customer_id which references to customer(id),
                "problem" : The problem description which client has stated,
                "level"(optional) : The required level to resolve this inquiry}
```


**Compliance**:

 * To approve/reject document:
``` json
    "action" : "review_document"
    "data"   : {"id"       : The id of this document,
                "approved" : The approval status}
```

 * To approve/reject transfer:
``` json
    "action" : "review_transfer"
    "data"   : {"id"       : The id of this transfer,
                "approved" : The approval status}
```

**Tasks**:

 * To get a task(suitable for my role and level):
``` json
    "action" : "get_task"
    "data"   : {"id"     : The id of document/transfer/inquiry,
                "type"   : One of the three types, document, transfer or inquiry}
```

 * To respond inquiry:
``` json
    "action" : "respond_inquiry"
    "data"   : {"id"       : The id of this inquiry,
                "answer"   : The answer to the problem,
                "closed"   : The status of this inquiry}
```

 * To escalate current task(document/transfer/inquiry):
``` json
    "action" : "escalate_task"
    "data"   : {"id"     : The id of document/transfer/inquiry,
                "type"   : One of the three types, document, transfer or inquiry,
                "level"  : The required level for resolving this task}
```