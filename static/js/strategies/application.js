var text_structure = {
    name: '',
    type: 'text',
    size: 'medium',
    required: true,
    _default: undefined,
    showCaption: true
};

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
        var sections = [];

        sectionControllers = model.sections.map(function(sectionMember) {
            return createController(sectionMember);
        });

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

                sectionControllers.forEach(function (controller) {
                    controller.onSave();
                });
            },

            onDelete: function () {
                sectionControllers.forEach(function (controller) {
                    controller.onDelete();
                });
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