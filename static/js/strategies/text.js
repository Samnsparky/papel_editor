/*
 * Controller strategy for text input.
 *
 * Note: This strategy is a terminal node.
 */
var text_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'text';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#text-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'showCaption': USE_COMMON_DEFAULT,
            'required': USE_COMMON_DEFAULT,
            'size': USE_COMMON_DEFAULT,
            'default': USE_COMMON_DEFAULT,
        });

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'required': model.required,
                        'size': model.size,
                        'size_selects' : createSizeSelects(model.size),
                        'default': model['default'],
                    },
                    createPartials([
                        'delete_button',
                        'name',
                        'show_caption',
                        'required',
                        'size',
                        'default',
                    ])
                );
                view = $(viewTarget);
                view.html(rendered);

                // Note that the rest of the DOM, with subsequent .delete-buttons,
                // has not been rendered yet, so this model's .delete-button is
                // the only existing .delete-button.
                transactionalListen(view, '.delete-button', 'click', this.onDelete);

                // Note to self:
                // In non-terminal models, this is where the sub models would render
                // (after events for class buttons have been registered)
            },

            onSave: function () {
                model.name = view.find('.name-input').val();
                model.showCaption = view.find('.show-caption-input').is(':checked');
                model.required = view.find('.required-input').is(':checked');
                model.size = resolveFromHumanSize(view.find('.size-input').val());
                model['default'] = view.find('.default-input').val();
            },

            onDelete: function (event) {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller text input validateInput stub');
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
                    'default',
                ]);
                return json;
            }
        };
        return retObj;
    }
};