/**
 * Created by Alex Beauchemin
 */

//TODO: Change div for <a> and allow tabbing
//TODO: If too many choices, add scroll bar
//TODO: Change attr('id') for attr('name')  line

;
(function ($) {
    $.extend({
        CustomSelect: function (el, options) {
            var settings = $.extend({
                closeTimeout: 500,
                defaultElement: 'last', // last,first or a value
                direction: 'right',
                maxWidth: null, // int or false/null for no limit
                exclude: null
            }, options || {});

            var self = this,
                elements = {};

            var initialize = function () {

                if (!el)
                    el = $('select');
                else if (typeof el == "string") {
                    el = $(el);
                }

                $.each(el, function (index, el) {
                    var elSelect = $(el),
                        id = elSelect.attr('id'),
                        options = [],
                        element,
                        excluded = false;

                    removeIfExists(id);

                    //Excludes
                    if (settings.exclude) {
                        $.each(settings.exclude, function (index, excludedEl) {
                            if (elSelect[0] == excludedEl[0]) {
                                excluded = true;
                                return;
                            }
                        });

                        if (excluded) {
                            return true;
                        }
                    }

                    elements[id] = new CustomField(
                        id,
                        elSelect.width(),
                        elSelect,
                        elSelect.offset()
                    );

                    element = elements[id];

                    element.oldField.hide().addClass('custom-select-old');
                    element.newField = $(createNewField(elSelect)).insertAfter(elSelect);

                    $.each(elSelect.find('option'), function (index, option) {
                        option = $(option);
                        if (!option.attr('disabled')) {
                            options.push({
                                value:option.val(),
                                text:option.html()
                            });
                        }
                    });

                    element.options = options;
                    element.optionsContainer = $('<div class="custom-select-container"></div>').appendTo($('body'));
                    createOptions(element);
                    element.optionsList = element.optionsContainer.find('.custom-select-options');

                    setDefaultClass(element);

                    element.optionsContainer.find('ul li').each(function (index, option) {
                        if ($(option).width() > element.fieldWidth)
                            element.fieldWidth = $(option).width();
                    });

                    if(settings.maxWidth && element.fieldWidth > settings.maxWidth)
                        element.newField.width(settings.maxWidth + 25);
                    else
                        element.newField.width(element.fieldWidth + 25);

                    setDefaultDimensions(element);
                    setDefaultValue(element);
                    hide(element);
                    addEvents(element);
                });

            };

            var addEvents = function (element) {
                element.newField.on({
                    mouseenter: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        if (elements[id].closeTimeout)
                            clearTimeout(elements[id].closeTimeout);
                    },
                    mouseleave: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        close(elements[id]);
                    },
                    blur: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        close(elements[id]);
                    },
                    click: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        open(elements[id]);
                    },
                    focus: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        open(elements[id]);
                    }
                });

                element.optionsList.on({
                    mouseenter: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        open(elements[id]);
                    },
                    mouseleave: function () {
                        var self = $(this);
                        if (self.prop('disabled') === true) {
                            return;
                        }

                        var id = self.data('link');
                        close(elements[id]);
                    }
                });

                element.optionsList.on('click', 'li a', function (event) {
                    event.preventDefault();

                    var el = $(this),
                        id = el.closest('.custom-select-options').data('link'),
                        value = el.data('value'),
                        content = el.html() + getRequiredElement(elements[id]);

                    if (el.prop('disabled') === true) {
                        return;
                    }

                    content += '<span class="custom-select-input-required"></span>';

                    elements[id].newField.html(content).addClass('selected');
                    elements[id].oldField.val(value).trigger('change');

                    setDefaultClass(elements[id]);

                    close(elements[id], true);
                });
            };

            var adjustPosition = function (element) {
                var position = element.newField.offset(),
                    left = position.left + element.newField.outerWidth(),
                    top = position.top;

                if (settings.direction == 'down') {
                    left = position.left;
                    top = position.top + element.newField.outerHeight();
                }

                element.optionsContainer.css({position: 'absolute', 'top': top, 'left': left});
            };

            var animateOpen = function (element) {
                element.optionsList.stop(true, false);
                element.optionsContainer.css('visibility', 'visible');
                element.newField.addClass('open');

                if (settings.direction == 'down') {
                    element.optionsList.width(element.newField.outerWidth());
                    //Fix for the height when some element are on 2 lines
                    var height = element.optionsList.height(),
                        fullHeight = element.optionsList.height('auto').height();
                    //Endfix
                    element.optionsList.height(height);
                    element.optionsList.animate({height: fullHeight}, 'fast', function () {
//                        adjustPosition(element); //Adjust if scrollbar appears
                    });
                }

                else {
                    element.optionsList.height(element.liHeight);

                    element.optionsList.animate({width: element.width}, 'fast', function () {
                        //Fix for the height when some element are on 2 lines
                        var height = element.optionsList.height(),
                            fullHeight = element.optionsList.height('auto').height();
                        //Endfix
                        element.optionsList.height(height);
                        element.optionsList.animate({height: fullHeight}, 'fast', function () {
//                            adjustPosition(element); //Adjust if scrollbar appears
                        });
                    });
                }



            };

            var animateClose = function (element) {
                element.optionsList.stop(true, false);
                var height = element.liHeight;
                if (settings.direction == 'down')
                    height = 0;

                element.optionsList.animate({height: height}, 'fast', function () {
                    if (settings.direction == 'down') {
                        element.newField.removeClass('open');
                        hide(element);
                    }
                    else {
                        element.optionsList.animate({width: 0}, 'fast', function () {
                            element.newField.removeClass('open');
                            hide(element);
                        });
                    }

                });
            };

            var close = function (element, noWaitTime) {
                if (element.isOpen) {
                    var delay = settings.closeTimeout;
                    if (noWaitTime)
                        delay = 0;
                    element.closeTimeout = setTimeout(function () {
                        element.isOpen = false;
                        animateClose(element);
                    }, delay);
                }
            };

            var createNewField = function (oldField) {
                var id = oldField.attr('id'),
                    name = oldField.attr('name'),
                    placeholder = oldField.val() || oldField.find('option').first().html(),
                    tabindex = oldField.attr('tabindex'),
                    required = oldField.attr('required'),
                    requiredElement = '',
                    content = placeholder,
                    attributes = '';

                elements[id].placeholder = placeholder;

                if (required) {
                    required = ' required';
                    elements[id].required = true;
                    requiredElement = getRequiredElement(elements[id]);
                }
                else {
                    required = '';
                }

                var enabledFilter = oldField.data('toggle-enabled-filter');
                if (typeof enabledFilter !== 'undefined') {
                    attributes += 'data-toggle-enabled-filter="' + enabledFilter + '" ';
                }

                if(tabindex) {
                    attributes += 'tabindex="' + tabindex + '" ';
                    oldField.removeAttr('tabindex');
                }

                if (elements[id].fieldWidth < 80)
                    elements[id].fieldWidth = 80;

                var result = [
                    '<div class="custom-select-input' + required + ' ' + settings.direction + '" ',
                        'data-link="' + id + '" ',
                        attributes,
                        ' style="width: ' + (elements[id].fieldWidth + 20) + 'px;">',
                            content,
                            requiredElement,
                    '</div>'
                	].join('');

                return result;
            };

            var createOptions = function (element) {
                var content = '<ul class="custom-select-options ' + settings.direction + '" data-link="' + element.id + '">';
                $.each(element.options, function (index, option) {
                    content += '<li><a href="#" data-value="' + option.value + '">' + option.text + '</a></li>';
                });
                content += '</ul>';
                element.optionsContainer.append(content);
            };

            var getRequiredElement = function (element) {
                if (element.required)
                    return '<span>*</span>';
                return '';
            };

            var hide = function (element) {
                element.optionsList.width(0).height(element.liHeight);
                element.optionsContainer.css('visibility', 'hidden');
            };

            var open = function (element) {
                if (element.closeTimeout)
                    clearTimeout(element.closeTimeout);
                if (!element.isOpen) {
                    element.isOpen = true;
                    adjustPosition(element);
                    animateOpen(element);
                }
            };

            var removeIfExists = function (id) {
                var existingItem = $('.custom-select-input[data-link="' + id + '"]');
                if (existingItem.length) {
                    existingItem.remove();
                    $('.custom-select-container .custom-select-options[data-link="' + id + '"]').remove();
                }
            };

            var setDefaultDimensions = function (element) {
                element.height = element.optionsList.height();
                element.width = element.optionsList.width();
                element.liHeight = element.optionsList.find('li').first().height();
            };

            var setDefaultValue = function (element) {
                var val = element.oldField.find('option[value="' + element.placeholder + '"]');
                if (val.length) {
                    for (var i = 0; i < element.options.length; i++) {
                        var obj = element.options[i];
                        if (element.placeholder == obj.value) {
                            element.oldField.val(obj.value);
                            element.newField.addClass('selected').html(obj.text + getRequiredElement(element));
                        }
                    }
                }
            };

            var setDefaultClass = function(element) {
                var value = null;

                if(settings.defaultElement == 'last')
                    if(element.options.length)
                        value = element.options[element.options.length-1].value;
                else if(settings.defaultElement == 'first')
                    if(element.options.length)
                        value = element.options[0].value;
                else
                    value = settings.defaultElement;

                if(value != null) {
                    if(element.oldField.val() == value) {
                        element.newField.addClass('default');
                    }
                    else {
                        element.newField.removeClass('default');
                    }
                }
            };


            //Object
            function CustomField(id, fieldWidth, oldField, position) {
                this.closeTimeout = null;
                this.newField = null;
                this.fieldWidth = fieldWidth;
                this.height = 0;
                this.id = id;
                this.isOpen = false;
                this.liHeight = 0;
                this.oldField = oldField;
                this.options = {};
                this.optionsContainer = null;
                this.optionsList = null;
                this.placeholder = '';
                this.position = position;
                this.required = false;
                this.width = 0;
            }

            //TODO: Refactor with prototype functions
            //CustomField.prototype.open = function(){
            //    console.log(this);
            //};

            initialize();
            return this;
        }
    });
})(jQuery);