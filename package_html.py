"""Convienence command line utility to combine the HTML for Papel Editor.

Convienence command line utility to combine the HTML for Papel Editor into a
single HTML file with some options to make easier to integrate into another
existing application with its own template engine.

@author: Rory Olsen
@author: Sam Pottinger
@license: GNU GPL v3
"""


import sys

import jinja2

USAGE_STR = '''Incorrect number of arguments provided.

EXAMPLE: python package_html.py /update {{papel}} false consolidated.html
         {{lbrace}} {{rbrace}}

USAGE: python package_html.py [url] [json] [debug] [lbrace] [rbrace] [output]
       
       url: The URL where the editor should make requests. See README
           for additional information.

       json: The JSON to have the editor use. Can be a template string for
           later replacement in another application.

       debug: Javascript expression indiciating if the editor should run
           in debug mode (puts out additional information to console).
           Can be a template string for later replacement in another
           application.

       lbrace: The string to use for the lbrace "{". Can be used to help manage
           templating engines on the destination application.

       rbrace: The string to use for the rbrace "}". Can be used to help manage
           templating engines on the destination application.

       output: The filename / path where the consolidated HTML should be
           output.
'''


def render_consolidated_html(server_url, startup_json, debug, lbrace, rbrace):
    """Main function to render papel_chrome.html as a combined HTML file.

    @param server_url: The base URL where the editor should target.
    @type server_url: str
    @param startup_json: The JSON (or template tag for JSON) to use in the
        rendered HTML.
    @type startup_json: str
    @param debug: Javascript expression (or template tag) to determine if the
        editor should run in "debug" mode.
    @type debug: str
    @param lbrace: The left curly brace value.
    @type lbrace: str
    @param rbrace: The right curly brace value.
    @type rbrace: str
    @return: The rendered combined HTML.
    @rtype: str
    """

    name = 'Papel Editor'

    # Convienence function to get the contents of a file.
    def getFileContents(file_name):
        with open(file_name, 'r') as f:
            return f.read()

    # Load up component HTML files
    application_editor = getFileContents('templates/application_editor.html')
    section = getFileContents('templates/section.html')
    subsection = getFileContents('templates/subsection.html')
    fields = getFileContents('templates/fields.html')
    components = getFileContents('templates/components.html')
    tree_view_sidebar = getFileContents('templates/tree_view_sidebar.html')

    # Simulate a Flask jinja environemnt
    jinja_env = jinja2.Environment(
        loader=jinja2.FileSystemLoader('templates')
    )
    template = jinja_env.get_template('papel_chrome.html')

    # Render with standin values (five square braces) to replace with user
    # provided values
    retVal = template.render(
        base_url='[[[[[server_url]]]]]',
        app_title=name,
        app_name=name,
        application_editor=application_editor,
        section=section,
        subsection=subsection,
        fields=fields,
        components=components,
        tree_view_sidebar=tree_view_sidebar,
        startup_json='[[[[[startup_json]]]]]',
        debug='[[[[[debug]]]]]'
    )

    # Avoid having the rbrace replace a "}" in the lbrace string
    retVal = retVal.replace('{', '[[[[[lbrace]]]]]')
    retVal = retVal.replace('}', '[[[[[rbrace]]]]]')

    # Put in user defined values for common elements
    retVal = retVal.replace('[[[[[lbrace]]]]]', lbrace)
    retVal = retVal.replace('[[[[[rbrace]]]]]', rbrace)
    retVal = retVal.replace('[[[[[server_url]]]]]', server_url)
    retVal = retVal.replace('[[[[[startup_json]]]]]', startup_json)
    retVal = retVal.replace('[[[[[debug]]]]]', debug)

    return retVal


def main():
    """Entry point for the Papel editor package HTML utility.

    Entry point for the convienence Papel editor package HTML utility. Renders
    the papel_chrome template as a single HTML file easy to include in another
    project.

    @return: Status code to report to the OS.
    @rtype: int
    """
    if len(sys.argv) != 7:
        print USAGE_STR
        return -1

    server_url = sys.argv[1]
    startup_json = sys.argv[2]
    debug = sys.argv[3]
    lbrace = sys.argv[4]
    rbrace = sys.argv[5]
    output_path = sys.argv[6]

    final_html = render_consolidated_html(
        server_url,
        startup_json,
        debug,
        lbrace,
        rbrace
    )

    with open(output_path, 'w') as f:
        f.write(final_html)

    return 0


if __name__ == '__main__':
    sys.exit(main())
