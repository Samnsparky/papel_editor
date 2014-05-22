/*
 * Controller strategy for dropdown_with_subfields input.
 *
 * Note: This strategy is a terminal node.
 */
var dropdown_with_subfields_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'dropdown_with_subfields';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#dropdown-with-subfields-input-template').html();
        Mustache.parse(template);

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'type': model.type,
                        'type_dropdown_with_subfields': true,
                        'name': model.name,
                        'show_caption': model.showCaption,
                        'required': model.required,
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
                model.size = view.find('.size-input').val();
                model._default = view.find('.default-input').val();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller dropdown_with_subfields input validateInput stub');
                return true;
            },

            toJSON: function () {
                return {
                    'type': model.type,
                    'name': model.name,
                    'showCaption': model.showCaption,
                    'required': model.required,
                    'size': model.size,
                    'default': model._default,
                };
            }
        };
        return retObj;
    }
};