/**
* form表单处理
*/
define(['zepto.js'], function ($) {
	var FormObject = function ($form, options) {
		if (!$form) {
			throw new Error('the first argument can\'t be empty , and must be $form!');
		}

		this.$form = $($form);

		// 禁掉浏览器默认验证
		this.$form[0].noValidate = true;
		this.options = options || {};
	};

	var formProto = FormObject.prototype;

	// 内部函数
	var Util = {
		invokeIfExists: function (func, args, context) {
			if (typeof func === 'function') {
				return func.apply(context, args);
			}
		}
	};

	/**
	* 获取form表单数据，返回的为json字符串
	* @method getData
	* @return {String} JSON字符串
	* @public
	*/
	formProto.getData = function (options) {
		options = $.extend(this.options.parse || {}, options);
		var controllers = {};
	 	$([].slice.call(this.$form.get(0).elements)).each(function() {
            var el = $(this);
            var type = el.attr('type');
            if (this.nodeName.toLowerCase() !== 'fieldset' && type !== 'submit' && type !== 'reset' && type !== 'button' &&
                ((type !== 'radio' && type !== 'checkbox') || this.checked)) {
	        	var name = el.attr('name');
	        	if (!name) {
	        		return;
	        	}
	        	if (!controllers[name]) { 
	        		controllers[name] = {
	        			els: [el]
	        		};
	        	}
            	controllers[name].els.push(el);
			}
		});
		if ($.isArray(options)) {
			$.each(options, function (option) {
				var name = option.name;
				if (controllers[name]) {
					controllers[name].valueName = name;
					controllers[name].value = option.parse(name, controllers[name].els);
				}
			});
		}

		$.each(controllers, function (name, controller) {
			if (controller.value) {
				return;
			}
			$.each(controller.els, function (index, el) {
	        	var value = el.val();
	        	if (value === undefined || value === '') {
	        		return;
	        	}
	        	var valueType = el.attr('value-type') || 'string';
				if (valueType.indexOf('int') > -1) {
					value = parseInt(value, 10);
				} else if (valueType.indexOf('boolean') > -1) {
					value = Boolean(value);				
				}
				var valueName = el.attr('value-name') || name;
				var subjectTo = el.attr('subject-to');
				if (subjectTo) {
					valueName = subjectTo + '.' + valueName;
				}
				controller.valueName = valueName;
				controller.value = value;
			});

		});

		var formData = {};
		$.each(controllers, function (name, controller) {
			if (!controller.valueName) {
				return;
			}
			var fileds = controller.valueName.split('.');
			var value;
			if (fileds.length > 1) {
				if (typeof formData[fileds[0]] !== 'object') {
					formData[fileds[0]] = {};
				}
				var obj = formData[fileds[0]];
				for (var i = 1; i < fileds.length - 1; i++){
					if (typeof obj[fileds[i]] !== 'object') {
						obj[fileds[i]] = {};
					}
					obj = obj[fileds[i]];
				}
				value = obj[fileds[fileds.length - 1]];
				if (value === undefined) {
					obj[fileds[fileds.length - 1]] = controller.value;
				} else {
					obj[fileds[fileds.length - 1]] = [value, controller.value];
				}
			} else {
				value = formData[fileds[0]];
				if (value === undefined) {
					formData[fileds[0]] = controller.value;
				} else {
					formData[fileds[0]] = [value, controller.value];
				}
			}
		});
		return formData;
	};

	/**
	* 验证表单
	* @method validate
	* @param {Object} validateOptions
	* @return {Boolean} true代表验证通过，false代表验证未通过
	* @public
	*/
	formProto.validate = function (options) {
		options = $.extend(this.options.validate || {}, options);
		var formData = this.getData();
		var isValid = true;

		function createErrorObj (type, name, value) {
			return {
				type: type,
				name: name,
				value: value,
				formData: formData
			};
		}
		$.each(options, function (name, rules) {
			var value = formData[name];
			$.each(rules, function (type, validator) {
				var singleValid = true;
				if (typeof validator === 'string') {
					validator = {
						value: validator
					};
				}

				if (type === 'required' && validator.value && value === undefined) {
					singleValid = false;
				} else if (type === 'pattern') {
					if (typeof validator.value === 'string') {
						validator.value = new RegExp(validator.value);
					}
					if (value === undefined || value === null) {
						singleValid = false;
					} else {
						value = value.toString();
						var result = value.match(validator.value);
						if (!result || result[0] !== value) {
							singleValid = false;
						}
					}
				} else if (type === 'max-length' || type === 'maxlenght' || type === 'maxLenght') {
					if (value && value.length > validator.value) {
						singleValid = false;
					}
				} else if (type === 'min-length' || type === 'minlenght' || type === 'minLenght') {
					if (value && value.length < validator.value) {
						singleValid = false;							
					} 
				} else {
					if(Util.invokeIfExists(validator.value, [name, value, formData]) === false) {
						singleValid = false;
					}
				}

				if (!singleValid) {
					isValid = singleValid;
					Util.invokeIfExists(validator.onError, [createErrorObj(type, name, value)]);
				}
			});
		});
		return isValid;
	};

	/**
	* 绑定表单提交事件
	* @method submit
	* @param {Object} options
	* @public
	*/
	formProto.submit = function (options, validateOptions) {
		var self = this;
		if (!self.validate(validateOptions)) {
			return false;
		}
		// 保证submit后页面不会跳转
		this.$form.submit(function (e){
			e.preventDefault();
		});
		// 触发submit事件
		this.$form.submit();
	
		options = $.extend(this.options.submit, {
			type: 'POST'
		}, options);

		if (!options.data) {
			options.data = $.param(self.getData());
		}		

		Util.invokeIfExists(options.startSubmit);

		$.ajax(options);
	};

	return FormObject;
});