/*
 * Controller strategy for essay input.
 *
 * Note: This strategy is a terminal node.
 */
var essay_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'essay';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#essay-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'showCaption': USE_COMMON_DEFAULT,
            'prompt': USE_COMMON_DEFAULT,
            'characterLimit': USE_COMMON_DEFAULT,
        });

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'type': model.type,
                        'type_essay': true,
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'character_limit': model.characterLimit,
                        'prompt': model.prompt,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'name',
                        'show_caption',
                        'prompt',
                        'character_limit',
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
                model.characterLimit = view.find('.character-limit-input').val();
                model.prompt = view.find('.prompt-input').val();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller essay input validateInput stub');
                return true;
            },

            toJSON: function () {
                var json = {
                    'type': model.type,
                    'name': model.name,
                    'showCaption': model.showCaption,
                    'required': model.required,
                };
                addIfMeaningful(model, json, [
                    'prompt',
                    'characterLimit',
                ]);
                return json;
            }
        };
        return retObj;
    }
};