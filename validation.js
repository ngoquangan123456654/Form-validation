function Validator(formSelector) {
  var _this = this;

  var formRules = {};

  // Quy ước tạo rules: 
  //  - Nếu có lỗi return error message
  //  - Ko lỗi return undefined
  // Các hàm định nghĩa xử lý rules
  var validatorRules = {
    required: function (value) {
      return value ? undefined : 'Vui lòng nhập trường này';
    },
    email: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : 'Email chưa chính xác';
    },
    min: function (min) {
      return function (value) {
        return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`;
      }
    },
    max: function (max) {
      return function (value) {
        return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự`;
      }
    },
    confirm: function (getConfirmValue) {
      var confirmValue = function () {
        return document.querySelector(getConfirmValue).value;
      }
      console.log(confirmValue());
      return function (value) {
        return value === confirmValue ? undefined : 'Vui lòng nhập đúng';
      }
    }
  }


  // Hàm lấy thẻ cha có chứa id từ thẻ con
  function getParents(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }


  //Lấy ra form element trong DOM theo formSelector
  var formElement = document.querySelector(formSelector);

  // Nếu có element trong DOM bắt đầu xử lý
  if (formElement) {
    // console.log(formElement);
    var inputs = formElement.querySelectorAll('[name][rules]');
    // console.log(inputs);

    for(var input of inputs) {

      var rules = input.getAttribute('rules').split('|');
      for(var rule of rules) {

        var isRuleHasValue = rule.includes(':');
        var ruleInfo;
        if (isRuleHasValue) {
          ruleInfo = rule.split(':');
          
          rule = ruleInfo[0];
        }
        // console.log(rule); 

        var ruleFunc = validatorRules[rule];
        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }

        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc);
        } else {
          formRules[input.name] = [ruleFunc];
        }

        // Lắng nghe sự kiện validate
        input.onblur = handleValidate;
        input.oninput = handleClearError;

      }

      // Hàm thực hiện validate
      function handleValidate(event) {
        var rules = formRules[event.target.name];

        var errorMessage
        for ( var rule of rules) {
          errorMessage = rule(event.target.value);
          if (errorMessage) {
            break;
          }
        }

        // Nếu có lỗi thì hiển thị ra UI
        if (errorMessage) {
          var formGroup = getParents(event.target, '.form-group');
          if (formGroup) {
            formGroup.classList.add('invalid');

            var formMessage = formGroup.querySelector('.form-message');
            if (formMessage) {
              formMessage.innerText = errorMessage;
            }
          }
        }

        return !errorMessage;
      }


      // Hàm xóa errorMessage
      function handleClearError(event) {
        var formGroup = getParents(event.target, '.form-group');
        if (formGroup.classList.contains('invalid')) {
          formGroup.classList.remove('invalid');

          var formMessage = formGroup.querySelector('.form-message');
          if (formMessage) {
            formMessage.innerText = '';
          }
        }
      }


    }


    // Xử lý hành vi submit form
    formElement.onsubmit = function (event) {
      event.preventDefault();

      var inputs = formElement.querySelectorAll('[name][rules]');
      var isValid = true;

      for(var input of inputs) {
        if (!handleValidate({target: input})) {
          isValid = false;
        }
      }  


      // Khi ko có lỗi thì submit form
      if (isValid) {
        if (typeof _this.onSubmit === 'function') {
          var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');

          var formValues = Array.from(enableInputs).reduce(function (values, input) {

            // Chia các case : input là checkbox,radio \
            switch (input.type) {
              // case 1
              case 'radio':
                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                break;
              // case 2
              case 'checkbox':  
                if (!input.matches(':checked')) {
                  values[input.name] = [];
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
                break;
              // case 3
              case 'file':
                values[input.name] = input.files;
                break;
              //default 
              default: values[input.name] = input.value;
            }

            return values;           
          }, {});
          _this.onSubmit(formValues);
        } else {
          formElement.submit();
        }
      }
    }


    // console.log(formRules);
  }
}