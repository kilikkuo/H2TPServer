Prototype: Backoffice Task Manager
==================================

Files Overview
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

 * Define pratical behaviors for different roles.
 * 

usercenter.py:

 * Create Admin/Compliance/Service user according to the data loaded into memory.
 * Responsible of identifyinig whether the user is authenticated or not.

InfoCenter:

 * Connect to database and load data into memory.
 * Prepare DB task which is supposed to performs the sql statement
 * Manage current pending reviews/inquiries in memory


API
------------

The prototype will be an application server that exposes a
JSON-over-HTTP API (perhaps REST, but not necessarily). No web
interface is necessary. In addition, there should be:

 * A database schema (for Postgres)
 * A way to generate sample data (e.g. a script calling the admin APIs)
 * A functional test suite (which calls the APIs)
 * Simple API docs (sample calls)
 * Notes on design choices

The server can be written in Erlang (Cowboy) or Python (Flask). If
you're not familiar with either, let me know what you're comfortable
with (but please not Rails or Node!).


Mock Application
----------------

An SQL schema is provided separately which creates mock tables for
users, roles, customers, documents, and transfers. You may extend them
if you wish, and/or create new tables for the task manager.

"Users" are EMQ backoffice staff. Their roles are defined in the
`user_role` table as (`role_name`, `level`), where `role_name` is
"admin", "service" (CSRs) or "compliance" (AML check staff). Their
`level` is used for task escalation: If a level 1 user escalates a
task, it should go to a user of at least level 2, and so on.

There are three types of task:

 * Review a document (compliance role)
 * Review a transfer (compliance role)
 * Respond to a customer inquiry (service role)

Every document and transfer must be reviewed. Customer inquiries are
on-demand.

Note that in the real system there are many more types of task, and
the design should plan for this.

When a user receives a task, they can:

 * Complete it (after taking some actions), or
 * Escalate it (to a higher level of the same role)


API
---

Each user role (admin, compliance, service) has access to different
APIs. The mock application APIs are:

Everyone:

 * Get customer (includes list of related document and transfer IDs)
 * Get document
 * Get transfer

Admin:

 * Create customer
 * Create document (and review task)
 * Create transfer (and review task)
 * Create customer inquiry task

Compliance:

 * Approve/reject document
 * Approve/reject transfer

Tasks:

 * Get a task (suitable for my user role and level)
 * Complete current task
 * Escalate current task
 

Access Control
--------------

Authentication isn't part of the prototype so there is no login
process. API calls should include an `X-EMQ-User` header containing a
username, and access control should be based on that.

Access rules are:

 * `admin` users can call any API at any time
 * `compliance` and `service` users can only view (or change) data
   related to their current task



