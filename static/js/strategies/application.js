
var application_structure = {
    name: 'Application Name',
    openDate: '2013-11-26',
    openDateHuman: '',
    closeDate: '',
    closeDateHuman: '',
    sections: [
        {
            "name": "General",
            "subsections": [
                [
                    {
                        "name": "First Name",
                        "required": true,
                        "type": "text",
                        "size": "large",
                        "showCaption": false,
                        "default": "hello default"
                    },
                    {
                        "name": "Middle Name",
                        "required": true,
                        "type": "text",
                        "size": "large",
                        "showCaption": false,
                        "default": "hello default"
                    },
                    {
                        "name": "Birthday",
                        "required": false,
                        "type": "date",
                        "showCaption": true
                    },
                    {
                        "name": "Home phone",
                        "required": true,
                        "type": "phoneNumber",
                        "size": "medium",
                        "showCaption": true
                    },
                    {
                        "name": "SAT Mathematics Score",
                        "showCaption": true,
                        "type": "number",
                        "required": true,
                        "min": 200,
                        "max": 800,
                        "size": "medium",
                        "default": "SAT DEFAULT HERE"
                    },
                    {
                        "name": "Gender",
                        "showCaption": true,
                        "required": true,
                        "type": "dropdown",
                        "options": [
                            "Female",
                            "Male",
                            "Intersex",
                            "Other",
                            "Choose not to disclose"
                        ],
                        "allowFreeText": true
                    }
                ]
            ]
        }
    ]
};

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

            render: function (viewTarget) {
                var rendered = Mustache.render(template, {
                    'name': model.name,
                    'openDate': model.openDate,
                    'openDateHuman': model.openDateHuman,
                    'closeDate': model.closeDate,
                    'closeDateHuman': model.closeDateHuman
                });
                view = $(viewTarget);
                view.html(rendered);

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