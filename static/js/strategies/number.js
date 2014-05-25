/*
 * Controller strategy for number input.
 *
 * Note: This strategy is a terminal node.
 */
var number_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'number';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#number-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'showCaption': USE_COMMON_DEFAULT,
            'required': USE_COMMON_DEFAULT,
            'size': USE_COMMON_DEFAULT,
            'default': USE_COMMON_DEFAULT,
            'min': USE_COMMON_DEFAULT,
            'max': USE_COMMON_DEFAULT,
        });

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'type': model.type,
                        'type_number': true,
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'required': model.required,
                        'min': model.min,
                        'max': model.max,
                        'size': model.size,
                        'size_selects' : createSizeSelects(model.size),
                        'default': model.default,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'name',
                        'show_caption',
                        'required',
                        'min',
                        'max',
                        'size',
                        'default',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                view.find('.delete-button').on('click', this.onDelete);

                // Note to self:
                // In non-terminal models, this is where the sub models would render
                // (after events for class buttons have been registered)
            },

            onSave: function () {
                model.type = view.find('.type-input').val();
                model.name = view.find('.name-input').val();
                model.showCaption = view.find('.show-caption-input').is(':checked');
                model.required = view.find('.required-input').is(':checked');
                model.min = view.find('.min-input').val();
                model.max = view.find('.max-input').val();
                model.size = view.find('.size-input').val();
                model._default = view.find('.default-input').val();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller number input validateInput stub');
                return true;
            },

            toJSON: function () {
                var json = {
                    'type': model.type,
                    'name': model.name,
                    'showCaption': model.showCaption,
                    'required': model.required,
                    'size': model.size,
                };
                addIfMeaningful(model, json, [
                    'min',
                    'max',
                    'default',
                ]);
                return json;
            }
        };
        return retObj;
    }
};