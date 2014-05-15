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

        return {
            render: function (viewTarget) {
                var rendered = Mustache.render(template, {
                    'name': model.name,
                    'type': model.type,
                    'type_text': true,
                    'size': model.size,
                    'size_selects' : createSizeSelects(model.size),
                    'required': model.required,
                    'default': model.default,
                    'show_caption': model.showCaption
                });
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
                model.name = view.find('.name-input').val();
                model.required = view.find('.required-input').is(':checked');
                model.type = view.find('.type-input').val();
                model.size = view.find('.size-input').val();
                model._default = view.find('.default-input').val();
                model.showCaption = !view.find('.show-caption-input').is(':checked');
            },

            onDelete: function () {
                view.remove();
                innerOnDelete();
                signalSave();
            },

            validateInput: function () {
                console.log('contoller text input validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'name': model.name,
                    'type': model.type,
                    'size': model.size,
                    'required': model.required,
                    'default': model._default,
                    'showCaption': model.showCaption
                }
            }
        };
    }
};