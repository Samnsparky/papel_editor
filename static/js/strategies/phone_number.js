/*
 * Controller strategy for phone number input.
 *
 * Note: This strategy is a terminal node.
 */
var phone_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'phoneNumber';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#phone-number-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'showCaption': USE_COMMON_DEFAULT,
            'required': USE_COMMON_DEFAULT,
            'size': USE_COMMON_DEFAULT,
        });

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'type': model.type,
                        'type_phone_number': true,
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'required': model.required,
                        'size': model.size,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'name',
                        'show_caption',
                        'required',
                        'size'
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                view.find('.delete-button').on('click', this.onDelete);
            },

            onSave: function () {
                model.type = view.find('.type-input').val();
                model.name = view.find('.name-input').val();
                model.showCaption = view.find('.show-caption-input').is(':checked');
                model.required = view.find('.required-input').is(':checked');
                model.size = view.find('.size-input').val();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller date input validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'type': model.type,
                    'name': model.name,
                    'showCaption': model.showCaption,
                    'required': model.required,
                    'size': model.size,
                }
            }
        };
        return retObj;
    }
};