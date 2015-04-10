# TADHack 2015 London

Project for TADHack 2015 in London

## Fixed-To-Mobile Number Mapper - API

Implementation of Fixed-To-Mobile Number Mapper RESTful API.

The URL is available at https://api.number-mapper.com/.

## API Resources

### General

- /api/v1: API  base URL

### Fixed-To-Mobile Number Mapper

**CRUD:**

- **GET** /api/v1/users : READ all users
- **POST** /api/v1/users : CREATE users
- **GET** /api/v1/users/:id : READ user
- **PUT** /api/v1/users/:id : UPDATE user
- **DELETE** /api/v1/users/:id : DELETE user

**Use Postman:**

Type: `raw/JSON (application/json)`

**Content:**

```json
  {
    "mobileNr" : "1214312523465",
    "pin" : "4442",
    "fixedNr" : "11221113111"
  }
```

**Website interaction:**

- **GET** /api/v1/mobile : Nexmo - SMS endpoint for processing "link fixedNr pin" SMS
- **GET** /api/v1/fixed : RestComm - Endpoint for processing call to verify fixed number
- **GET** /api/v1/request-fixed/:number : RestComm - Check if this fixed number is requested to be linked
- **GET** /api/v1/verify-fixed/:number : Display linked mobile number
- **GET** /api/v1/verify-mobile/:number : Display linked fixed number

### Test Resources

- **GET** /api/v1/incoming-sms : Nexmo Incoming SMS handler
- **GET** /api/v1/restcomm : RESTComm External Service handler
- **GET** /api/v1/status : Status webhook for various services
