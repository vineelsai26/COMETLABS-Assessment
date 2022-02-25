# Event-Specific Coding platform

## Running the code

make sure you have the latest version of the code and filled in the .env file.

```sh
yarn install
yarn start
```

variables in the .env file:

MONGODB_URL
JWT_ACCESS_TOKEN
JWT_REFRESH_TOKEN
SPHERE_PROBLEMS_URL
SPHERE_SUBMISSIONS_URL
SPHERE_PROBLEMS_TOKEN

## Testing the code

The API is hosted at [https://sphere-engine-cometlabs.herokuapp.com](https://sphere-engine-cometlabs.herokuapp.com)

## Features

- [Signup](#Signup)
- [Login](#Login)
- [Logout](#Logout)
- [Refresh Auth Token](#Refresh-Auth-Token)
- [List All Questions](#List-All-Questions)
- [List Uploaded Questions](#List-Uploaded-Questions)
- [Add Questions](#Add-Questions)
- [Edit Questions](#Edit-Questions)
- [Delete Questions](#Delete-Questions)
- [Add Test Cases](#Add-Test-Cases)
- [Home Page](#Home-Page)
- [List All Test Cases](#List-Test-Cases)
- [Edit Test Cases](#Edit-Test-Cases)
- [User Submisions](#User-Submisions)
- [List All Submissions](#List-All-Submissions)
- [List Submissions By Users](#List-Submissions-By-Users)
- [List Submissions for Questions](#List-Submissions-for-Questions)
- [List Self Submissions](#List-Self-Submissions)

***Make sure you are using correct Bearer Token for all the requests.***

<a id="Signup"></a>

### Signup

route - [/signup](https://sphere-engine-cometlabs.herokuapp.com/login)

Signup takes a POST request with four parameters name, email, password, role and gives you email, accessToken, refreshToken as response.

Request:

- POST

Parameters:

- name
- email
- password
- role

![img](screenshots/Screenshot(1).png)

<a id="Login"></a>

### Login

route - [/login](https://sphere-engine-cometlabs.herokuapp.com/login)

Login takes a POST request with two parameters email, password and gives you email, accessToken, refreshToken as response

Request:

- POST

Parameters:

- email
- password

![img](screenshots/Screenshot(3).png)

<a id="Logout"></a>

### Logout

route - [/logout](https://sphere-engine-cometlabs.herokuapp.com/logout)

Login takes a POST request with refreshToken

Request:

- POST

Parameters:

- refreshToken

![img](screenshots/Screenshot(20).png)

<a id="Refresh-Auth-Token"></a>

### Refresh Auth Token

route - [/refresh](https://sphere-engine-cometlabs.herokuapp.com/refresh)

Refresh takes a POST request with refreshToken and gives you accessToken, refreshToken as response

Request:

- POST

Parameters:

- refreshToken

![img](screenshots/Screenshot(4).png)

<a id="Home-Page"></a>

### Home Page

route - [/](https://sphere-engine-cometlabs.herokuapp.com/)

Greets the user with the name and role

![img](screenshots/Screenshot(5).png)

<a id="List-All-Questions"></a>

### List All Questions

route - [/displayQuestions](https://sphere-engine-cometlabs.herokuapp.com/displayQuestions)

displayQuestions takes a GET request and gives you all questions in Sphere Engine as response including uploaded and auto generated

Request:

- GET

Parameters:

- NONE

![img](screenshots/Screenshot(6).png)

<a id="List-All-Uploaded-Questions"></a>

### List All Uploaded Questions

route - [/displayQuestions](https://sphere-engine-cometlabs.herokuapp.com/displayQuestions)

displayQuestions takes a GET request and gives you all questions uploaded by admins

Request:

- GET

Parameters:

- NONE

![img](screenshots/Screenshot(8).png)

<a id="Add-Questions"></a>

### Add Questions

route - [/addQuestion](https://sphere-engine-cometlabs.herokuapp.com/addQuestion)

addQuestion takes a POST request with parameters name, description

Request:

- POST

Parameters:

- name
- description
- masterJudgeID

![img](screenshots/Screenshot(7).png)

<a id="Edit-Questions"></a>

### Edit Questions

route - [/updateQuestion](https://sphere-engine-cometlabs.herokuapp.com/updateQuestion)

updateQuestion takes a POST request with parameters new name, new description, id of the question

Request:

- POST

Parameters:

- id
- name
- description

![img](screenshots/Screenshot(9).png)

<a id="Delete-Questions"></a>

### Delete Questions

route - [/deleteQuestion](https://sphere-engine-cometlabs.herokuapp.com/deleteQuestion)

deleteQuestion takes a POST request with id of the question

Request:

- POST

Parameters:

- id

![img](screenshots/Screenshot(10).png)

<a id="Add-Test-Cases"></a>

### Add Test Cases

route - [/addTestCase](https://sphere-engine-cometlabs.herokuapp.com/addTestCase)

addTestCase takes a POST request with id of the question, input, output, judgeId as the input

Request:

- POST

Parameters:

- id
- input
- output
- judgeId

![img](screenshots/Screenshot(11).png)

<a id="Edit-Test-Cases"></a>

### Edit Test Cases

route - [/updateTestCase](https://sphere-engine-cometlabs.herokuapp.com/updateTestCase)

updateTestCase takes a POST request with id of the question, input, output, number of test case as the input

Request:

- POST

Parameters:

- id
- input
- output
- number (test case number)

![img](screenshots/Screenshot(12).png)

<a id="List-Test-Cases"></a>

### List Test Cases

route - [/listTestCase](https://sphere-engine-cometlabs.herokuapp.com/listTestCase)

listTestCase takes a POST request with id of the question

Request:

- POST

Parameters:

- id

![img](screenshots/Screenshot(13).png)

<a id="User-Submisions"></a>

### User Submisions

route - [/submission](https://sphere-engine-cometlabs.herokuapp.com/submission)

submission takes a POST request with id of the question, source, compilerId as input

Request:

- POST

Parameters:

- problemId
- source
- compilerId

![img](screenshots/Screenshot(14).png)

<a id="List-All-Submissions"></a>

### List All Submissions

route - [/listAllSubmissions](https://sphere-engine-cometlabs.herokuapp.com/listAllSubmissions)

listAllSubmissions takes a GET request

Request:

- GET

Parameters:

- NONE

![img](screenshots/Screenshot(16).png)

<a id="List-Submissions-By-Users"></a>

### List Submissions By Users

route - [/listUserSubmissions](https://sphere-engine-cometlabs.herokuapp.com/listUserSubmissions)

listUserSubmissions takes a POST request with email of the user

Request:

- POST

Parameters:

- email

![img](screenshots/Screenshot(17).png)

<a id="List-Submissions-for-Questions"></a>

### List Submissions for Questions

route - [/listQuestionSubmissions](https://sphere-engine-cometlabs.herokuapp.com/listQuestionSubmissions)

listQuestionSubmissions takes a POST request with id of the question

Request:

- POST

Parameters:

- problemId

![img](screenshots/Screenshot(18).png)

<a id="List-Self-Submissions"></a>

### List Self Submissions

route - [/listSelfSubmissions](https://sphere-engine-cometlabs.herokuapp.com/listSelfSubmissions)

listSelfSubmissions takes a GET request with signed in user

Request:

- GET

Parameters:

- NONE

![img](screenshots/Screenshot(19).png)
