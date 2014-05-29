// Controller strategy for section
var section_strategy = {

    matches: function (model) {
        return model.subsections !== undefined;
    },

    createController: function (model, innerOnDelete, parent) {
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
            render: function reRender (viewTarget) {

                var rendered = Mustache.render(
                    template,
                    {
                        'name': model.name,
                        'subsections': model.subsections,
                        'section_id': getSectionId(parent.sections.indexOf(model)),
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
                transactionalListen(view, '.delete-button', 'click', this.onDelete);

                var addSection = function () {
                    var newSubsection = [];
                    model.subsections.push(newSubsection);
                    subsectionControllers.push(
                        subsection_strategy.createController(
                            newSubsection,
                            createInnerOnDelete(model.subsections, newSubsection, subsectionControllers)
                        )
                    );
                    reRender(viewTarget);
                    signalSave();
                };
                transactionalListen(view, '.add-subsection-button', 'click', addSection);

                var subsection_destinations = view.find('.subsection-content');
                subsectionControllers.forEach(function (controller, i) {
                    controller.render(subsection_destinations[i]);
                });
            },

            onSave: function () {
                model.name = view.find('.section-name').val();
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