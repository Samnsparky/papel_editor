// These are the strategies that have a matches function.
// Strategies that are manually added by other strategies do not belong here.
var controllerStrategies = [
    application_strategy,
    section_strategy,
    text_strategy,
    number_strategy,
    dropdown_strategy,
    date_strategy,
    phone_strategy,
    enumeration_table_strategy,
    dropdown_with_subfields_strategy,
    essay_strategy
];

/*
 * Function to create a size select dict as expected by #size-input-partial.
 */
var createSizeSelects = function(size) {
    return {
        'small': size == 'small',
        'medium': size == 'medium',
        'large': size == 'large',
    }
};

var padWithZeros = function(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}

/*
 * Converts invalid dates into a format that is understood by <input type="date">
 *
 * para date: The date to sanizize.
 * type date: str
 * return: the sanitized date
 * rtype: str
 */
var sanitizeDate = function(date) {
    var dateSplit = date.split('-');
    if (dateSplit[0].length != 4) {
        window.alert("Unexpected date format. Expected yyyy-mm-dd");
    }
    var dateObj = new Date (dateSplit[0], dateSplit[1], dateSplit[2]);
    var dayOfMonth = dateObj.getDate();
    var month = dateObj.getMonth() + 1; //Months are zero based
    var year = dateObj.getFullYear();
    var sanitizedDate = padWithZeros(year, 4) +
        "-" + padWithZeros(month, 2) +
        "-" + padWithZeros(dayOfMonth, 2);
    return sanitizedDate;
}

/*
 * Create a partials dict from a list of base partial names.
 *
 * partialsList example:
 *     ['type', 'delete', 'required']
 *
 * Returns a dict of parsed Mustache partials.
 */
var createPartials = function(partialsList) {
    var partialsOut = {};
    partialsList.forEach(function(partialBaseName) {
        var key = partialBaseName + '_partial';
        partialsOut[key] = $('#' + partialBaseName.replace('_', '-') + '-partial').html();
        Mustache.parse(partialsOut[key]);
    });
    return partialsOut;
};

var resolveFromHumanSize = function (size) {
    var sizeDict = {
        'Small': 'small',
        'Medium': 'medium',
        'Large': 'large',
    }
    return sizeDict[size];
};

var resolveFromHumanType = function (type) {
    var typeDict = {
        'Text': 'text',
        'Date': 'date',
        'Phone Number': 'phoneNumber',
        'Number': 'number',
        'Dropdown': 'dropdown',
        'Essay': 'essay',
        'Enumeration Table': 'enumerationTable',
        'Dropdown With Sub Fields': 'dropdownWithSubFields',
    }
    return typeDict[type];
};

var createController = function (model, innerOnDelete) {
    var matchingStrategy = controllerStrategies.filter(function (strategy) {
        return strategy.matches(model);
    })[0];

    if (matchingStrategy === undefined) {
        var errString = "Error: No matching strategy found for model:";
        console.log(errString, model);
        return;
    }

    return matchingStrategy.createController(model, innerOnDelete);;
};

var createInnerOnDelete = function (parent, nodeToDelete, controllersList)
{
    return function (controllerSelf) {
        if (parent.indexOf === undefined) {
            delete parent[nodeToDelete];
        }
        else {
            delete parent[parent.indexOf(nodeToDelete)];
        }

        if (controllersList !== undefined && controllerSelf !== undefined) {
            var index = controllersList.indexOf(controllerSelf);
            controllersList.splice(index, 1);
        }
    };
};

/*
 * Adds each attribute / key in keyList to jsonObj, but only if each key is
 * defined for model.
 */
var addIfMeaningful = function (model, jsonObj, keyList) {
    for (var i = 0; i < keyList.length; i++) {
        var key = keyList[i];
        var modelAttr = model[key];
        if (modelAttr !== undefined && modelAttr != '') {
            jsonObj[key] = modelAttr;
        }
    }
};

var USE_COMMON_DEFAULT = '_default';
var defaultDefaults = {
    'showCaption': true,
    'required': false,
    'size': 'medium',
    'default': undefined,
    'min': undefined,
    'max': undefined,
    'options': [],
    'allowFreeText': false,
    'prompt': undefined,
    'characterLimit': undefined,
    'itemType': '',
    'hidden': [], // TODO: or should this be undefined?
    'fields': [],
};
/*
 * Sets the defaults on model, if the entries in defaults are not found in model.
 */
var applyUnsetDefaults = function (model, defaults) {
    for (var key in defaults) {
        if (model[key] === undefined) {
            var value = defaults[key];
            if (value == USE_COMMON_DEFAULT) {
                value = defaultDefaults[key];
            }
            model[key] = value;
        }
    };
};

var forEachOnSave = function (controllers) {
    controllers.forEach(function (controller) {
        controller.onSave();
    });
};

var forEachOnDelete = function (controllers) {
    while (controllers.length != 0) {
        var controller = controllers[0];
        controllers[0].onDelete();
        if (controllers[0] === controller) {
            delete controller[0];
        }
    }
};

var applicationController = null;

var loadEditor = function () {
    var application_structure = JSON.parse($('#application-structure').html());
    applicationController = createController(application_structure);

    var listingViewTemplate = $('#application-editor-template').html();
    applicationController.setTemplate(listingViewTemplate);
    applicationController.render("#application-editor");
};

// http://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var spannedJSON = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
    return '<pre>' + spannedJSON + '</pre>'
}

var postToServer = function (json) {
    // TODO: post to server, remove the raw JSON output
    // str = str.replace('\n', '<br>');
    renderRawJSON(syntaxHighlight(json));
};

var renderRawJSON = function (json) {
    var jsonTemplate = "Raw JSON: {{{ raw }}}";
    var rendered = Mustache.render(jsonTemplate, {
        'raw': json
    });

    $("#raw-json-view").html(rendered);
};

var save = function () {
    if (applicationController.validateInput()) {
        applicationController.onSave();
        postToServer(applicationController.toJSON());
    }
};

var signalSave = function () {
    // TODO: Implement a timer or something
    save();
};

$(function() {
    hardcodedJSONSetup();
    loadEditor();
    save();
});


var hardcodedJSONSetup = function () {
    var application_structure = {
        name: "2014-2015 School Year",
        openDate: "2013-11-26",
        openDateHuman: "Nov 27, 2013",
        closeDate: "2013-2-18",
        closeDateHuman: "Feb 17, 2013 11:59 pm MST",
        sections: [
            {
                "name": "General",
                "subsections": [
                    [
                        {
                            "name": "First Name",
                            "required": true,
                            "type": "text",
                            "size": "large",
                            "showCaption": false,
                            "default": "hello default"
                        },
                        {
                            "name": "Middle Name",
                            "required": true,
                            "type": "text",
                            "size": "large",
                            "showCaption": false,
                            "default": "hello default"
                        },
                        {
                            "name": "Birthday",
                            "required": false,
                            "type": "date",
                            "showCaption": true
                        },
                        {
                            "name": "Home phone",
                            "required": true,
                            "type": "phoneNumber",
                            "size": "medium",
                            "showCaption": true
                        },
                        {
                            "name": "SAT Mathematics Score",
                            "showCaption": true,
                            "type": "number",
                            "required": true,
                            "min": 200,
                            "max": 800,
                            "size": "medium",
                            "default": "SAT DEFAULT HERE"
                        },
                        {
                            "name": "Description",
                            "showCaption": true,
                            "prompt": "This is a prompt",
                            "type": "essay",
                            "characterLimit": 500
                        },
                        {
                            "name": "Test",
                            "type": "dropdownWithSubFields",
                            "options": [
                                {
                                    "option": "SAT General (SAT I)",
                                    "subFields": [
                                        {
                                            "name": "SAT Mathematics Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 200,
                                            "max": 800
                                        },
                                        {
                                            "name": "SAT Critical Reading Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 200,
                                            "max": 800
                                        }
                                    ]
                                },
                                {
                                    "option": "ACT",
                                    "subFields": [
                                        {
                                            "name": "ACT English Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 1,
                                            "max": 36
                                        },
                                        {
                                            "name": "ACT Mathematics Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 1,
                                            "max": 36
                                        }
                                    ]
                                },
                                {
                                    "option": "Both SAT General and ACT",
                                    "subFields": [
                                        {
                                            "name": "SAT Mathematics Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 200,
                                            "max": 800
                                        },
                                        {
                                            "name": "SAT Critical Reading Score",
                                            "type": "number",
                                            "required": true,
                                            "min": 200,
                                            "max": 800
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Gender",
                            "showCaption": true,
                            "required": true,
                            "type": "dropdown",
                            "options": [
                                "Female",
                                "Male",
                                "Intersex",
                                "Other",
                                "Choose not to disclose"
                            ],
                            "allowFreeText": true
                        },
                        {
                            "name": "Supplemental Exams",
                            "required": false,
                            "itemType": "Exam Result",
                            "type": "enumerationTable",
                            "fields": [
                                {
                                    "name": "Type",
                                    "type": "dropdown",
                                    "required": true,
                                    "options": [
                                        "Advanced Placement (AP)",
                                        "SAT Subject Tests (SAT II)",
                                        "International Baccalaureate (Initio)",
                                        "International Baccalaureate (Standard)",
                                        "International Baccalaureate (Higher)"
                                    ]
                                },
                                {
                                    "name": "Subject (ex: Calculus BC)",
                                    "type": "text",
                                    "size": "medium",
                                    "required": true
                                },
                                {
                                    "name": "Score",
                                    "type": "number",
                                    "required": true,
                                    "default": "Not yet taken or scores not yet available.",
                                    "emptyAsDefault": true
                                }
                            ]
                        }
                    ]
                ]
            }
        ]
    };
    $('#application-structure').html(JSON.stringify(application_structure));
};