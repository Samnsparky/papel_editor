 // Controller strategy for subsection
 var subsection_strategy = {

     createController: function (model, innerOnDelete, options) {
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
            render: function reRender (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'subsection_text': subsectionText,
                        'fields': model,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'new_type',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                transactionalListen(view, '.delete-button', 'click', this.onDelete);

                var addField = function () {
                    var newType = view.find('.new-type-input').val();
                    var newField = {
                        type: resolveFromHumanType(newType),
                        name: view.find('.new-name-input').val(),
                    };
                    model.push(newField);

                    var newFieldController = createController(
                        newField,
                        createInnerOnDelete(model, newField, fieldControllers)
                    );
                    fieldControllers.push(newFieldController);

                    reRender(viewTarget);
                    signalSave();
                };

                transactionalListen(view, '.add-field-button', 'click', addField);
                preventDefault(view, '.new-name-input', 'keydown', 13);
                transactionalListen(view, '.new-name-input', 'keyup', function(e){
                    if (e.which == 13) {
                        addField();
                    }
                });

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

                if (deleteButton == 'delete') {
                    view.remove();
                    innerOnDelete(retObj);
                }

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
            },

            setTitle: function (title) {
                subsectionText = title;
            },

            /*
             * Sets the behavior of the delete button. Takes a string.
             *
             * behavior == 'delete': Deletes this subsection and sub elements.
             * behavior == 'clear':  Does not delete this subsection, but
             *     deletes sub elements.
             */
            setDeleteBehavior: function (behavior) {
                if (behavior != 'delete' && behavior != 'clear') {
                    console.log("Invalid subsection_strategy.setDeleteBehavior behavior:", behavior);
                }
                else {
                    deleteButton = behavior;
                }
            }
        };

        var deleteButton = 'delete';
        var subsectionText = 'Subsection';
        if (options !== undefined) {
            if (options.deleteButton !== undefined) {
                retObj.setDeleteBehavior(options.deleteButton);
            }
            if (options.subsectionText !== undefined) {
                retObj.setTitle(options.subsectionText);
            }
        }

        return retObj;
    }
};