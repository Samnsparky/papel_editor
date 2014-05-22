/*
 * Controller strategy for date input.
 *
 * Note: This strategy is a terminal node.
 */
var date_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'date';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#date-input-template').html();
        Mustache.parse(template);

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(
                    template,
                    {
                        'type': model.type,
                        'type_date': true,
                        'name': model.name,
                        'showCaption': model.showCaption,
                        'required': model.required,
                    },
                    createPartials([
                        'delete_button',
                        'type',
                        'name',
                        'show_caption',
                        'required',
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
                };
            }
        };
        return retObj;
    }
};