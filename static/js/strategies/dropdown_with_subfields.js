var DROPDOWN_WITH_SUBFIELDS_TYPE = 'dropdownWithSubFields';

// (Secret) controller strategy for dropdown options entry with subfields
var with_subfields_options_entry_strategy = {
    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#dropdown-with-subfields-options-entry-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'required': USE_COMMON_DEFAULT,
            'options': USE_COMMON_DEFAULT,
        });

        var subsection_controller = subsection_strategy.createController(
            model.subFields,
            createInnerOnDelete(model, model.subFields),
            {
                deleteButton: 'clear',
                subsectionText: 'Clear Options',
            }
        );

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'option': model.option
                    },
                    createPartials([
                        'delete_button'
                    ])
                );

                view = $(viewTarget);
                view.html(rendered);

                transactionalListen(view, '.deleteButton', 'click', this.onDelete);

                var subfields_destination = view.find('.subsection-content');
                subsection_controller.render(subfields_destination);
            },

            onSave: function () {
                model.option = view.find('.with-subfields-options-input').val();
                subsection_controller.onSave();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller dropdown options with subfield entry validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'option': model.option,
                    'subFields': subsection_controller.toJSON(),
                };
            }
        };
        return retObj;
    }
};

// (Secret) controller strategy for dropdown_with_subfields options
//
// Contains with_subfields_options_entry_strategy objects
var options_with_subfields_strategy = {
    createController: function (model) {
        var view = null;
        var optionsControllers = [];
        var template = $('#dropdown-with-subfields-options-template').html();
        Mustache.parse(template);

        var createSubfieldsEntryController = function (theModel, newEntry) {
            return with_subfields_options_entry_strategy.createController(
               newEntry,
               createInnerOnDelete(theModel, newEntry, optionsControllers)
            );
        };

        // Add the results of the map operation to the end of controllers array,
        // rather than creating a new array. (Not adding the results would make
        // the controllers array reference in the inner on delete function useless).
        Array.prototype.push.apply(
            optionsControllers,
            model.map(function(entry) {
                return createSubfieldsEntryController(model, entry);
            })
        );

        var retObj = {
            render: function reRender (viewTarget) {
                var rendered = Mustache.render(template, {
                    'options': model
                });
                view = $(viewTarget);
                view.html(rendered);

                var addEntry = function() {
                    var entry = {
                        'option': view.find('.new-with-subfields-options-entry-input').val(),
                        'subFields': []
                    }
                    model.push(entry);
                    optionsControllers.push(createSubfieldsEntryController(model, entry));
                    reRender(viewTarget);
                    signalSave();
                };

                transactionalListen(view, '.add-with-subfields-options-entry-button', 'click', addEntry);
                transactionalListen(view, '.new-with-subfields-options-entry-input', 'keyup', function(e) {
                    if (e.which == 13) {
                        addEntry();
                    }
                });

                var destinations = view.find('.dropdown-with-subfields-options-entry-content');
                optionsControllers.forEach(function (controller, i) {
                    controller.render(destinations[i]);
                });
            },

            onSave: function () {
                forEachOnSave(optionsControllers);
            },

            onDelete: function () {
                forEachOnDelete(optionsControllers);
            },

            validateInput: function () {
                optionsControllers.forEach(function (controller) {
                    controller.validateInput();
                });
                console.log('contoller dropdown options validateInput stub');
                return true;
            },

            toJSON: function () {
                return optionsControllers.map(function (controller) {
                    return controller.toJSON();
                })
            }
        };
        return retObj;
    }
};

/*
 * Controller strategy for dropdown_with_subfields input.
 *
 * Note: This strategy is not a terminal node; it contains options which can
 *       each contain one subsection (array of fields).
 */
var dropdown_with_subfields_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === DROPDOWN_WITH_SUBFIELDS_TYPE;
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#dropdown-with-subfields-input-template').html();
        Mustache.parse(template);

        var options_controller = options_with_subfields_strategy.createController(model.options);

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'type': DROPDOWN_WITH_SUBFIELDS_TYPE,
                        'type_dropdown_with_subfields': true,
                        'name': model.name,
                        'required': model.required,
                        'options': model.options,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'name',
                        'required',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                transactionalListen(view, '.delete-button', 'click', this.onDelete);

                // Note to self:
                // In non-terminal models, this is where the sub models would render
                // (after events for class buttons have been registered)
                var destination = view.find('.dropdown-with-subfields-options-content');
                options_controller.render(destination);
            },

            onSave: function () {
                model.type = DROPDOWN_WITH_SUBFIELDS_TYPE;
                model.name = view.find('.name-input').val();
                model.required = view.find('.required-input').is(':checked');
                options_controller.onSave();
            },

            onDelete: function () {
                options_controller.onDelete();

                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller dropdown_with_subfields input validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'type': DROPDOWN_WITH_SUBFIELDS_TYPE,
                    'name': model.name,
                    'required': model.required,
                    'options': options_controller.toJSON(),
                };
            }
        };
        return retObj;
    }
};