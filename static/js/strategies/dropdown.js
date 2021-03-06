// (Secret) controller strategy for dropdown options entry
var options_entry_controller = {
    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#dropdown-options-entry-template').html();
        Mustache.parse(template);

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template, {
                        'options_entry': model
                    }
                );

                view = $(viewTarget);
                view.html(rendered);

                transactionalListen(view, '.remove-options-entry-button', 'click', this.onDelete);
            },

            onSave: function () {
                model = view.find('.options-entry-input').val();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller dropdown options entry validateInput stub');
                return true;
            },

            toJSON: function () {
                return model;
            }
        };
        return retObj;
    }
};

// (Secret) controller strategy for dropdown options
var options_strategy = {
    createController: function (model) {
        var view = null;
        var optionsEntryControllers = [];
        var template = $('#dropdown-options-template').html();
        Mustache.parse(template);

        var createEntryController = function (theModel, newEntry) {
            return options_entry_controller.createController(
               newEntry,
               createInnerOnDelete(theModel, newEntry, optionsEntryControllers)
            );
        };

        // Add the results of the map operation to the end of controllers array,
        // rather than creating a new array. (Not adding the results would make
        // the controllers array reference in the inner on delete function useless).
        Array.prototype.push.apply(
            optionsEntryControllers,
            model.map(function(entry) {
                return createEntryController(model, entry);
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
                    var entry = view.find('.new-options-entry-input').val();
                    model.push(entry);
                    optionsEntryControllers.push(createEntryController(model, entry));
                    reRender(viewTarget);
                    signalSave();
                };

                transactionalListen(view, '.add-options-entry-button', 'click', addEntry);
                preventDefault(view, '.new-options-entry-input', 'keydown', 13);
                transactionalListen(view, '.new-options-entry-input', 'keyup', function(e){
                    if (e.which == 13) {
                        addEntry();
                    }
                });

                var options_entry_destinations = view.find('.dropdown-options-entry-content');
                optionsEntryControllers.forEach(function (controller, i) {
                    controller.render(options_entry_destinations[i]);
                });
            },

            onSave: function () {
                forEachOnSave(optionsEntryControllers);
            },

            onDelete: function () {
                forEachOnDelete(optionsEntryControllers);
            },

            validateInput: function () {
                optionsEntryControllers.forEach(function (controller) {
                    controller.validateInput();
                });
                console.log('contoller dropdown options validateInput stub');
                return true;
            },

            toJSON: function () {
                return optionsEntryControllers.map(function (controller) {
                    return controller.toJSON();
                })
            }
        };
        return retObj;
    }
};

/*
 * Controller strategy for dropdown input.
 *
 * Note: This strategy is a terminal node (from an encapsulated point-of-view).
 */
var dropdown_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'dropdown';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#dropdown-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'options': USE_COMMON_DEFAULT,
            'showCaption': USE_COMMON_DEFAULT,
            'required': USE_COMMON_DEFAULT,
            'allowFreeText': USE_COMMON_DEFAULT,
        })

        var options_controller = options_strategy.createController(model.options);

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'required': model.required,
                        'allow_free_text': model.allowFreeText,
                    },
                    createPartials([
                        'delete_button',
                        'name',
                        'show_caption',
                        'required',
                        'dropdown_options',
                        'allow_free_text',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                transactionalListen(view, '.delete-button', 'click', this.onDelete);

                options_controller.render(view.find('.dropdown-options-content'));
            },

            onSave: function () {
                model.name = view.find('.name-input').val();
                model.showCaption = view.find('.show-caption-input').is(':checked');
                model.required = view.find('.required-input').is(':checked');
                model.options = options_controller.onSave();
                model.allowFreeText = view.find('.allow-free-text-input').is(':checked');
            },

            onDelete: function () {
                options_controller.onDelete();

                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller dropdown input validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'type': model.type,
                    'name': model.name,
                    'showCaption': model.showCaption,
                    'required': model.required,
                    'allowFreeText': model.allowFreeText,
                    'options': options_controller.toJSON(),
                };
            }
        };
        return retObj;
    }
};