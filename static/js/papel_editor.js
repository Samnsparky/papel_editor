var controllerStrategies = [
    application_strategy,
    section_strategy,
    text_strategy,
    dropdown_strategy,
    date_strategy,
    phone_strategy,
    enumeration_table_strategy,
    dropdown_subfields_strategy
];

var createSizeSelects = function(size) {
    return {
        'small': size == 'small',
        'medium': size == 'medium',
        'large': size == 'large',
    }
};

var createController = function (model, innerOnDelete) {
    var matchingStrategy = controllerStrategies.filter(function (strategy) {
        return strategy.matches(model);
    })[0];

    if (matchingStrategy === undefined) {
        window.alert("Error: No matching strategy found");
        return;
    }

    newController = matchingStrategy.createController(model, innerOnDelete);
    return newController;
};

var createInnerDeleteOn = function(parent, nodeToDelete) {
    return function () {
        var index = parent.indexOf(nodeToDelete);
        delete parent[index];
    };
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

// .... later inside an on save
var save = function () {
    if (applicationController.validateInput()) {
        applicationController.onSave();
        postToServer(applicationController.toJSON());
    }
    // registerEvents(class_based_events);
};

var signalSave = function () {
    // TODO: Implement a timer or something
    save();
};

// var showModalForHideCaptionHelp = function () {
//     window.alert('showModalForHideCaptionHelp is here to help!');
// };

// var registerEvents = function(events) {
//     $.each(events, function(index, func) {
//         var action = index.split(' ')[0];
//         var target = index.split(' ')[1];
//         $(target).on(action, func);
//     });
// };

// var class_based_events = {
//     'click .hide-caption-help-button': showModalForHideCaptionHelp
// };

$(function() {
    loadEditor();
    save();
});
