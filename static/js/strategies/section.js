 // (Secret) controller strategy for subsection
 var subsection_strategy = {
     createController: function (model, onDelete) {
        var view = null;
        var fieldControllers = [];
        var template = $('#subsection-template').html();
        Mustache.parse(template);

        fieldControllers = model.map(function(field) {
            return createController(field, createInnerDeleteOn(model, field));
        });

        return {
            render: function (viewTarget) {
                var rendered = Mustache.render(template, {
                    'fields': model
                });
                view = $(viewTarget);
                view.html(rendered);

                var field_destinations = view.find('.field-content');

                fieldControllers.forEach(function (controller, i) {
                    controller.render(field_destinations[i]);
                });
            },

            onSave: function () {
                fieldControllers.forEach(function (controller) {
                    controller.onSave();
                });
            },

            onDelete: onDelete,

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
    }
};

// Controller strategy for section
var section_strategy = {

    matches: function (model) {
        return model.subsections !== undefined;
    },

    createController: function (model) {
        var view = null;
        var subsectionControllers = [];
        var template = $('#section-template').html();
        Mustache.parse(template);

        subsectionControllers = model.subsections.map(function(subsection) {
            return subsection_strategy.createController(subsection);
        });
        // subsectionControllers is now array of array of field controllers

        return {
            render: function (viewTarget) {
                var rendered = Mustache.render(template, {
                    'subsections': model
                });
                view = $(viewTarget);
                view.html(rendered);

                var subsection_destinations = view.find('.subsection-content');
                subsectionControllers.forEach(function (controller, i) {
                    controller.render(subsection_destinations[i]);
                });
            },
            onSave: function () {
                subsectionControllers.forEach(function (controller) {
                    controller.onSave();
                });
                // ...
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
    }
};