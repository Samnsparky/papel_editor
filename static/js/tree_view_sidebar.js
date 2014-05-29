
// Controller for the tree view, which provides drag-and-drop functionality and
// navigation for the user.
var tree_view_controller = {

    createController: function (model, applicationController) {
        var view = null;
        var template = $('#tree-view-sidebar-template').html();
        Mustache.parse(template);

        var registerScrollTo = function (linkTarget, destinationTarget) {
            $(linkTarget).click(function(){
                $.scrollTo($(destinationTarget), {duration:500});
            });
        };

        var updateTree = function (scrollTree, sectionLinks) {
            scrollTree['#to-top'] = '#product-id';
            scrollTree['#application-meta-link'] = '#application-meta';

            var sections = model.sections;
            for (var i = 0; i < sections.length; i++) {
                var linkBase = getSectionId(i);
                var linkName = linkBase + "-link";

                scrollTree[linkName] = linkBase;
                sectionLinks.push({
                    'link_name': linkName,
                    'name': sections[i].name,
                });
            }
        };

        var controllerObj = {
            render: function (viewTarget) {
                var scrollTree = {};
                var sectionLinks = [];
                updateTree(scrollTree, sectionLinks);

                var rendered = Mustache.render(template, {
                    'model': model,
                    'section_links': sectionLinks,
                    'section': function () {
                        return '<a id="' + this.link_name + '" href="#">' + this.name + '</a>' +
                            '<a class="secret" href="#' + scrollTree[this.link_name] + '">' + this.name + '</a>';
                    }
                });
                view = $(viewTarget);
                view.html(rendered);

                for (key in scrollTree) {
                    registerScrollTo(key, scrollTree[key]);
                }

                var createScrollAction = function (sectionInfo) {
                    return function () {
                        var destination = $('.section-name').filter(function () {
                            return this.value==sectionInfo.name;
                        });
                        $.scrollTo(destination, {
                            duration: 500,
                            offset: -50,
                        });
                    };
                };

                for (var i = 0; i < sectionLinks.length; i++) {
                    view.find("#" + sectionLinks[i].link_name).click(
                        createScrollAction(sectionLinks[i])
                    );
                }
            },

            refreshScrollSpy: function () {
                $('[data-spy="scroll"]').each(function () {
                    var $spy = $(this).scrollspy('refresh');
                });

                view.affix();
            },
        };

        return controllerObj;
    }
};
