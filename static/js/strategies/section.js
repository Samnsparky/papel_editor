 // (Secret) controller strategy for subsection
 var subsection_strategy = {
     createController: function (model, innerOnDelete) {
        var view = null;
        var fieldControllers = [];
        var template = $('#subsection-template').html();
        Mustache.parse(template);

        // Add the results of the map operation to the end of controllers array,
        // rather than creating a new array. (Not adding the results would make
        // the controllers array reference in the inner on delete function useless).
        Array.prototype.push.apply(
            fieldControllers,
            model.map(function(field, index, array) {
                return createController(
                    field,
                    createInnerOnDelete(model, field, fieldControllers)
                );
            })
        );

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'fields': model,
                    },
                    createPartials([
                        'delete_button',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                view.find('.delete-button').on('click', this.onDelete);

                var field_destinations = view.find('.field-content');

                fieldControllers.forEach(function (controller, i) {
                    controller.render(field_destinations[i]);
                });
            },

            onSave: function () {
                forEachOnSave(fieldControllers);
            },

            onDelete: function () {
                forEachOnDelete(fieldControllers);

                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller subsection validateInput stub');
                return true;
            },

            toJSON: function () {
                return fieldControllers.map(function (controller) {
                    return controller.toJSON();
                })
            }
        };
        return retObj;
    }
};

// Controller strategy for section
var section_strategy = {

    matches: function (model) {
        return model.subsections !== undefined;
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var subsectionControllers = [];
        var template = $('#section-template').html();
        Mustache.parse(template);

        // Add the results of the map operation to the end of controllers array,
        // rather than creating a new array. (Not adding the results would make
        // the controllers array reference in the inner on delete function useless).
        Array.prototype.push.apply(
            subsectionControllers,
            model.subsections.map(function(subsection) {
                return subsection_strategy.createController(
                    subsection,
                    createInnerOnDelete(model, subsection, subsectionControllers)
                );
            })
        );

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'subsections': model
                    },
                    createPartials([
                        'delete_button'
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                view.find('.delete-button').on('click', this.onDelete);

                var subsection_destinations = view.find('.subsection-content');
                subsectionControllers.forEach(function (controller, i) {
                    controller.render(subsection_destinations[i]);
                });
            },

            onSave: function () {
                forEachOnSave(subsectionControllers);
            },

            onDelete: function () {
                forEachOnDelete(subsectionControllers);

                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller section validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'name': model.name,
                    'subsections': subsectionControllers.map(
                        function (controller) {
                            return controller.toJSON();
                        }
                    )
                }
            }
        };
        return retObj;
    }
};