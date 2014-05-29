
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
 * Function to create a size select dict as expected by #size-input-partial.
 */
var createSizeSelects = function(size) {
    return {
        'small': size === 'small',
        'medium': size === 'medium',
        'large': size === 'large',
    }
};

var padWithZeros = function(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}

/*
 * Generates the id of the section, given the index of that section.
 */
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
    if (date === '') {
        console.log("Date is blank");
        return;
    }

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

var isArray = function (target) {
    return target.indexOf !== undefined;
}

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
    'subFields': [],
};
/*
 * Sets the defaults on model, if the entries in defaults are not found in model.
 */
var applyUnsetDefaults = function (model, defaults) {
    for (var key in defaults) {
        if (model[key] === undefined) {
            var value = defaults[key];
            if (value === USE_COMMON_DEFAULT) {
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

var transactionKeeper = {
    state: 'outside transaction',
    signals: {},
    startTransaction: function () {
        if (transactionKeeper.state === 'inside transaction') {
            console.log('Inside of transaction but tried starting transaction.');
            return false;
        }

        transactionKeeper.state = 'inside transaction';
        signals = [];
        return true;
    },
    afterTransaction: function (signal, callback) {
        if (transactionKeeper.state === 'outside transaction') {
            console.log('Outside of transaction but tried transaction signal.');
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
            if(!transactionKeeper.startTransaction()) {
                return;
            }

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
};

var preventDefault = function (view, selector, event, key) {
    view.find(selector).on(event, function(e) {
        if (e.which === key) {
            e.preventDefault();
        }
    });
};