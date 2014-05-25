
var application_strategy = {
    matches: function (model) {
        return model.openDate !== undefined;
    },

    createController: function (model) {
        var view = null;
        var template = null;
        var sectionControllers = [];

        // Add the results of the map operation to the end of controllers array,
        // rather than creating a new array. (Not adding the results would make
        // the controllers array reference in the inner on delete function useless).
        Array.prototype.push.apply(
            sectionControllers,
            model.sections.map(function(section) {
                return createController(
                    section,
                    createInnerOnDelete(model, section, sectionControllers)
                );
            })
        );

        return {
            setTemplate: function (newTemplate) {
                template = newTemplate
                Mustache.parse(template);
            },

            render: function reRender (viewTarget) {
                var rendered = Mustache.render(template, {
                    'name': model.name,
                    'openDate': sanitizeDate(model.openDate),
                    'openDateHuman': model.openDateHuman,
                    'closeDate': sanitizeDate(model.closeDate),
                    'closeDateHuman': model.closeDateHuman,
                    'sections': model.sections
                });
                view = $(viewTarget);
                view.html(rendered);

                var addSection = function () {
                    var newSection = {
                        name: view.find('.new-section-input').val(),
                        subsections: []
                    };
                    model.sections.push(newSection);
                    sectionControllers.push(
                        createController(
                            newSection,
                            createInnerOnDelete(model.sections, newSection, sectionControllers)
                        )
                    );
                    reRender(viewTarget);
                    signalSave();
                };
                view.find('.add-section-button').on('click', addSection);
                view.find('.new-section-input').on('keyup', function(e){
                    if (e.which == 13) {
                        addSection();
                    }
                });

                // All subviews are listened to
                view.change(signalSave);

                var section_destinations = view.find('.section-content');
                sectionControllers.forEach(function (controller, i) {
                    controller.render(section_destinations[i]);
                });
            },

            onSave: function () {
                model.openDate = view.find('#open-date-input').val();
                model.openDateHuman = view.find('#open-date-human-input').val();
                model.closeDate = view.find('#close-date-input').val();
                model.closeDateHuman = view.find('#close-date-human-input').val();

                forEachOnSave(sectionControllers);
            },

            onDelete: function () {
                forEachOnDelete(sectionControllers);
            },

            validateInput: function () {
                console.log('application controller validateInput stub');
                return true;
            },

            toJSON: function () {
                var sections = [];
                sectionControllers.forEach(function (controller) {
                    sections.push(controller.toJSON());
                });
                return {
                    'name': model.name,
                    'openDate': model.openDate,
                    'openDateHuman': model.openDateHuman,
                    'closeDate': model.closeDate,
                    'closeDateHuman': model.closeDateHuman,
                    'sections': sections
                };
            },
        };
    }
};