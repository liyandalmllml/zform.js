# Zform.js
Zform.js is a library based on zepto.js for simplify form manipulating, and allows you to easily parse data, validate data, and submit data.Just as said, Zform.js only provide three api:
  * getData
  * validate
  * bindSubmit

In the future, there maybe more function, such as supporting async validating, more built-in validator etc.
  
##Zform
  ````javascript
  var form = new Zform('.form');
  ```
## API
### getData([options])
  ````javascript
  var data = form.getData();
  ````
 parse form data to object
### validate([options])
````javascript
  var isValid = form.validate({
    phone: {
      required: {
        value: 'required',
        onInvalid: function () {
          // do something
        }
      }
    },
    user: {
      pattern: /\w{3-9}/
    },
    password: {
      required: 'required'
    }
  });
````
 validate form according to validate options
### bindSubmit(options)
````javascript
  form.bindSubmit({
    url: 'http://xxx.xxx.xxx',
    type: 'POST',
    success: function () {
      // do something
    },
    error: function () {
      // do something
    },
    complete: function () {
      // do something
    }
  });
````
 bind form submit listener
