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

var getSectionId = function(sectionIndex) {
    return 'section-' + sectionIndex;
};

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

var isArray = function (target) {
    return target.indexOf !== undefined;
}

var createInnerOnDelete = function (parent, nodeToDelete, controllersList)
{
    return function (controllerSelf) {
        if (isArray(parent)) {
            parent.splice(parent.indexOf(nodeToDelete), 1);
        }

        else {
            delete parent[nodeToDelete];
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

var forEachOnSave = function (controllers, parentArray) {
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
var serverUrl = null;
var debug = null;

var loadEditor = function () {
    var application_structure = JSON.parse($('#application-structure').html());
    applicationController = createController(application_structure);

    serverUrl = $('#server-url').val();
    debug = $('#debug').val();

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
    return '<pre id="raw-json-container">' + spannedJSON + '</pre>'
}

var postSuccess = function () {
    console.log('post success');
};

var postToServer = function (url, json) {
    if (debug === "true") {
        console.log("would post to ", url);
    }
    else {
        $.post(
            url,
            {application: JSON.stringify(json)},
            postSuccess
        );
    }
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
        applicationController.render('#application-editor');
        postToServer(serverUrl, applicationController.toJSON());
    }
};

var signalSave = function () {
    afterTransaction('save', save);
};

var transactionKeeper = {
    state: 'outside transaction',
    signals: {},
    startTransaction: function () {
        if (transactionKeeper.state === 'inside transaction')
           throw 'Inside of transaction but tried starting transaction.';

        transactionKeeper.state = 'inside transaction';
        signals = [];
    },
    afterTransaction: function (signal, callback) {
        if (transactionKeeper.state === 'outside transaction') {
            console.log('Outside of transaction but tried transaction signal.');
            // throw 'Outside of transaction but tried transaction signal.';
        }

        signals[signal] = callback;
    },
    endTransaction: function () {
        for (signal in signals)
            signals[signal]();
        transactionKeeper.state = 'outside transaction';
    },
    makeTransaction: function (innerFunc) {
        return function () {
            transactionKeeper.startTransaction();
            var retVal = innerFunc.apply(innerFunc, arguments);
            transactionKeeper.endTransaction();
            return retVal;
        };
    }
};

var afterTransaction = transactionKeeper.afterTransaction;

var makeTransaction = transactionKeeper.makeTransaction;

var transactionalListen = function (view, selector, event, method) {
    view.find(selector).on(event, makeTransaction(method));
}

$(function() {
    hardcodedJSONSetup();
    loadEditor();
    save();
});


var hardcodedJSONSetup = function () {
    var application_structure = {
    "name": "2014-2015 School Year",
    "openDate": "2013-11-26",
    "openDateHuman": "Nov 27, 2013",
    "closeDate": "2013-2-18",
    "closeDateHuman": "Feb 17, 2013 11:59 pm MST",
    "sections": [
        {
            "name": "General",
            "subsections": [
                [
                    {
                        "name": "First Name",
                        "required": true,
                        "type": "text",
                        "size": "medium"
                    },
                    {
                        "name": "Middle Name",
                        "required": false,
                        "type": "text",
                        "size": "medium"
                    },
                    {
                        "name": "Last Name",
                        "required": true,
                        "type": "text",
                        "size": "medium"
                    }
                ],
                [
                    {
                        "name": "Gender",
                        "required": true,
                        "type": "dropdown",
                        "options": [
                            "Female",
                            "Male",
                            "Intersex",
                            "Other",
                            "Choose not to disclose"
                        ]
                    },
                    {
                        "name": "Birthday",
                        "required": true,
                        "type": "date"
                    }
                ],
                [
                    {
                        "name": "Home phone",
                        "required": true,
                        "type": "phoneNumber",
                        "size": "medium"
                    },
                    {
                        "name": "Cell phone",
                        "required": false,
                        "type": "phoneNumber",
                        "size": "medium"
                    }
                ],
                [
                    {
                        "name": "Address",
                        "required": true,
                        "type": "text",
                        "size": "medium"
                    },
                    {
                        "name": "City / Town",
                        "required": true,
                        "type": "text",
                        "size": "medium"
                    },
                    {
                        "name": "State / Province / etc.",
                        "required": true,
                        "type": "text",
                        "size": "small",
                        "default": "International student with no province."
                    },
                    {
                        "name": "Zip code",
                        "required": true,
                        "type": "text",
                        "size": "small",
                        "default": "International student with no zip code."
                    },
                    {
                        "name": "Country",
                        "required": true,
                        "type": "text",
                        "size": "medium"
                    }
                ],
                [
                    {
                        "name": "Name of High School or GED",
                        "required": true,
                        "type": "text",
                        "size": "medium",
                        "default": "GED"
                    }
                ]
            ]
        },
        {
            "name": "Academic Interests",
            "instructions": "Please list all majors, minors, and certificates you are currently considering. Please list all of your current interests even if you have not made a final decision. Note that you can enter option option for your major. <b>EHP does not base any application decisions on your stated interests.</b>",
            "subsections": [
                [
                    {
                        "name": "Interests",
                        "required": true,
                        "itemType": "Interest",
                        "type": "enumerationTable",
                        "fields": [
                            {
                                "name": "Type",
                                "type": "dropdown",
                                "options": [
                                    "Major",
                                    "Minor",
                                    "Certificate"
                                ],
                                "showCaption": false
                            },
                            {
                                "name": "Field",
                                "allowFreeText": true,
                                "type": "dropdown",
                                "options": [
                                    "Accounting",
                                    "Advertising",
                                    "Aerospace Engineering Sciences",
                                    "Anthropology",
                                    "Applied Mathematics",
                                    "Architectural Engineering",
                                    "Architecture Studies",
                                    "Art History",
                                    "Asian Studies",
                                    "Astronomy",
                                    "Biochemistry",
                                    "Biology",
                                    "Broadcast News",
                                    "Broadcast Production",
                                    "Broadcast news",
                                    "Broadcast production",
                                    "Chemical Engineering",
                                    "Chemical and Biological Engineering",
                                    "Chemistry",
                                    "Chinese",
                                    "Civil Engineering",
                                    "Classics",
                                    "Communication",
                                    "Computer Science",
                                    "Dance",
                                    "Design Studies",
                                    "Ecology and Evolutionary Biology",
                                    "Economics",
                                    "Electrical Engineering",
                                    "Electrical and Computer Engineering",
                                    "Engineering Physics",
                                    "English",
                                    "Environmental Design",
                                    "Environmental Engineering",
                                    "Environmental Studies",
                                    "Ethnic Studies",
                                    "Film Studies",
                                    "Finance",
                                    "French",
                                    "Geography",
                                    "Geological Sciences",
                                    "German Studies",
                                    "History",
                                    "Human Resources",
                                    "Humanities",
                                    "Information Management",
                                    "Integrative Physiology",
                                    "International Affairs",
                                    "Italian",
                                    "Japanese",
                                    "Jewish Studies",
                                    "Journalism",
                                    "Landscape Studies",
                                    "Linguistics",
                                    "Management",
                                    "Marketing",
                                    "(Pure) Mathematics",
                                    "Mechanical Engineering",
                                    "Media Studies",
                                    "Molecular, Cellular, and Developmental Biology",
                                    "Music",
                                    "Music Composition",
                                    "Music Education",
                                    "Music Performance",
                                    "News-Editorial",
                                    "Open Option",
                                    "Operations Management",
                                    "Philosophy",
                                    "Physics",
                                    "Planning Studies",
                                    "Political Science",
                                    "PreProfessional Health",
                                    "PreProfessional Law",
                                    "Psychology",
                                    "Religious Studies",
                                    "Russian Studies",
                                    "Sociology",
                                    "Spanish",
                                    "Speech, Language, and Hearing Sciences",
                                    "Studio Arts",
                                    "Teacher Licensure - Elementary",
                                    "Teacher Licensure - Music (K-12)",
                                    "Teacher Licensure - Secondary",
                                    "Technology, Arts, and Media",
                                    "Theatre",
                                    "Women and Gender Studies"
                                ],
                                "showCaption": false
                            }
                        ],
                        "showCaption": false
                    }
                ]
            ]
        },
        {
            "name": "SAT / ACT",
            "encrypt": true,
            "instructions": [
                "<p>While EHP considers far more than scores, we do ask for results from one or more standardized exam. Feel free to exercise discretion in which results to report. For example, if you completed both the ACT and the SAT but feel that the former better demonstrates your academic abilities, you may elect to submit your ACT scores.</p>",
                "<p>Furthermore, alongside CU general admission policy, please report your highest score from each test subsection. For example, if you achieved a 30 on ACT English and a 28 on ACT Mathematics during your first attempt but a 27 on English and 31 on Mathematics on your second attempt, report a 30 for English and a 31 on Mathematics.</p>",
                "<p>EHP may cross-reference values reported here with results submitted directly to general admissions.</p>"
            ],
            "subsections": [
                [
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
                                    },
                                    {
                                        "name": "SAT Writing Score",
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
                                    },
                                    {
                                        "name": "ACT Reading Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36
                                    },
                                    {
                                        "name": "ACT Science Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36
                                    },
                                    {
                                        "name": "ACT Writing Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 2,
                                        "max": 12,
                                        "default": "Writing section not taken / not reporting."
                                    },
                                    {
                                        "name": "ACT Combined English/Writing Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36,
                                        "default": "Writing section not taken / not reporting."
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
                                    },
                                    {
                                        "name": "SAT Writing Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 200,
                                        "max": 800
                                    },
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
                                    },
                                    {
                                        "name": "ACT Reading Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36
                                    },
                                    {
                                        "name": "ACT Science Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36
                                    },
                                    {
                                        "name": "ACT Writing Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 2,
                                        "max": 12,
                                        "default": "Writing section not taken / not reporting."
                                    },
                                    {
                                        "name": "ACT Combined English/Writing Score",
                                        "type": "number",
                                        "required": true,
                                        "min": 1,
                                        "max": 36,
                                        "default": "Writing section not taken / not reporting."
                                    }
                                ]
                            }
                        ]
                    }
                ]
            ]
        },
        {
            "name": "Other Scores / Credit",
            "instructions": "EHP may cross-reference values reported here with results submitted directly to general admissions. Applicants reporting A-level exams or other international tests may be contacted directly by EHP for additional information.",
            "subsections": [
                [
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
                    },
                    {
                        "name": "GCE A-Level Scores",
                        "required": false,
                        "itemType": "Exam Result",
                        "type": "enumerationTable",
                        "fields": [
                            {
                                "name": "Subject (ex: English Literature)",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Score (ex: B)",
                                "type": "text",
                                "size": "medium",
                                "required": true,
                                "default": "Not yet taken or scores not yet available.",
                                "emptyAsDefault": true
                            }
                        ]
                    },
                    {
                        "name": "College Credit",
                        "required": false,
                        "itemType": "Credit",
                        "type": "enumerationTable",
                        "fields": [
                            {
                                "name": "Subject (ex: Intro to Psychology)",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Institution Providing Credit",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Course Grade / Mark (ex: A-)",
                                "type": "text",
                                "size": "medium",
                                "default": "No grade or pass / fail.",
                                "emptyAsDefault": true,
                                "required": true
                            }
                        ]
                    }
                ]
            ]
        },
        {
            "name": "Activities and Awards",
            "instructions": "Please highlight your activities and awards below. Please only list awards in the awards section and not in the descriptions of activities. <b>Please make sure to click the \"Add this Activity\" and \"Add this Award\" buttons after adding a new activity and award respectively. After adding all of your activities and awards, please make sure to click \"Save and Continue\" at the bottom of the page.</b>",
            "subsections": [
                [
                    {
                        "name": "Activities",
                        "required": false,
                        "type": "enumerationTable",
                        "itemType": "Activity",
                        "hidden": [3],
                        "fields": [
                            {
                                "name": "Activity Name",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Person to Reference for Activity",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Reference Email",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Description",
                                "type": "essay",
                                "characterLimit": 500
                            }
                        ]
                    },
                    {
                        "name": "Awards",
                        "required": false,
                        "type": "enumerationTable",
                        "itemType": "Award",
                        "hidden": [3],
                        "fields": [
                            {
                                "name": "Award Name",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Person to Reference for Award",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Reference Email",
                                "type": "text",
                                "size": "medium",
                                "required": true
                            },
                            {
                                "name": "Description",
                                "type": "essay",
                                "characterLimit": 500
                            }
                        ]
                    }
                ]
            ]
        },
        {
            "name": "Writing",
            "instructions": "Please mind the character limit for each prompt. Also, note that you can enlarge a text editor by clicking and dragging in the lower right hand corner of the word processor.",
            "subsections": [
                [
                    {
                        "name": "Essay 1",
                        "prompt": "Describe the person you would want living down the hall from you in Andrews (note, we are not talking about your roommate).",
                        "type": "essay",
                        "showCaption": false,
                        "characterLimit": 2000
                    }
                ],
                [
                    {
                        "name": "Essay 2",
                        "type": "essay",
                        "showCaption": false,
                        "prompt": "If the “engineering lobe” of your brain was removed (i.e., you no longer wanted to be an engineer), what would you do instead?",
                        "characterLimit": 500
                    }
                ],
                [
                    {
                        "name": "Essay 3",
                        "type": "essay",
                        "showCaption": false,
                        "prompt": "Describe why you think EHP is a good fit for you.",
                        "characterLimit": 4000
                    }
                ],
                [
                    {
                        "name": "Essay 4",
                        "type": "essay",
                        "showCaption": false,
                        "prompt": "Describe a valuable experience of your high school career and why it was important to you.",
                        "characterLimit": 3000
                    }
                ]
            ]
        }
    ]
};
    $('#application-structure').html(JSON.stringify(application_structure));
};