/*
 * Controller strategy for enumeration_table input.
 *
 * Note: This strategy is not a terminal node, and contains one subsection.
 */
var enumeration_table_strategy = {

    matches: function (model) {
        return model.type !== undefined && model.type === 'enumerationTable';
    },

    createController: function (model, innerOnDelete) {
        var view = null;
        var template = $('#enumeration-table-input-template').html();
        Mustache.parse(template);

        applyUnsetDefaults(model, {
            'required': USE_COMMON_DEFAULT,
            'itemType': USE_COMMON_DEFAULT,
            'hidden': USE_COMMON_DEFAULT,
            'fields': USE_COMMON_DEFAULT,
        });

        var subsection_controller = subsection_strategy.createController(
            model.fields,
            createInnerOnDelete(model, model.fields)
        );
        subsection_controller.setTitle('Fields');
        subsection_controller.setDeleteBehavior('clear');

        var retObj = {
            render: function (viewTarget) {
                var rendered = Mustache.render(template,
                    {
                        'name': model.name,
                        'required': model.required,
                        'item_type': model.itemType,
                        'hidden': model.hidden,
                    },
                    createPartials([
                        'delete_button',
                        'name',
                        'required',
                        'item_type',
                        'hidden',
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
                var subsection_destination = view.find('.subsection-content');
                subsection_controller.render(subsection_destination);
            },

            onSave: function () {
                model.name = view.find('.name-input').val();
                model.required = view.find('.required-input').is(':checked');
                model.itemType = view.find('.item-type-input').val();
                model.hidden = view.find('.hidden-input').is(':checked');
                subsection_controller.onSave();
            },

            onDelete: function () {
                view.remove();
                innerOnDelete(retObj);
                signalSave();
            },

            validateInput: function () {
                console.log('contoller enumeration_table input validateInput stub');
                return true;
            },

            toJSON: function () {
                var json = {
                    'type': model.type,
                    'name': model.name,
                    'required': model.required,
                    'itemType': model.itemType,
                };
                addIfMeaningful(model, json, [
                    'hidden',
                ]);
                json['fields'] = subsection_controller.toJSON();
                return json;
            }
        };
        return retObj;
    }
};