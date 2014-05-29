/*
 * papel_editor.js
 *
 * The top-level controller for the application.
 */
var applicationController = null;
var serverUrl = null;
var debug = null;

var papelEditor = {

    loadEditor: function () {
        var application_structure = JSON.parse($('#application-structure').html());
        applicationController = application_strategy.createController(application_structure);

        serverUrl = $('#server-url').val();
        debug = $('#debug').val();

        var listingViewTemplate = $('#application-editor-template').html();
        applicationController.setTemplate(listingViewTemplate);
        applicationController.render("#application-editor");
    },

    save: function () {
        if (applicationController.validateInput()) {
            applicationController.onSave();
            applicationController.render('#application-editor');
            postToServer(serverUrl, applicationController.toJSON());
        }
    },
};

// TODO: Move this into papelEditor
var signalSave = function () {
    afterTransaction('save', papelEditor.save);
};

// These are the strategies that have a matches function.
// Strategies that are manually added by other strategies do not belong here.
var controllerStrategies = [
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

// TODO: Move this into papelEditor
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

$(function() {
    papelEditor.loadEditor();
    papelEditor.save();
});