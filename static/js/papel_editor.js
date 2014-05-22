var controllerStrategies = [
    application_strategy,
    section_strategy,
    text_strategy,
    number_strategy,
    dropdown_strategy,
    date_strategy,
    phone_strategy,
    enumeration_table_strategy,
    dropdown_with_subfields_strategy
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

var createController = function (model, innerOnDelete) {
    var matchingStrategy = controllerStrategies.filter(function (strategy) {
        return strategy.matches(model);
    })[0];

    if (matchingStrategy === undefined) {
        window.alert("Error: No matching strategy found");
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
    loadEditor();
    save();
});
