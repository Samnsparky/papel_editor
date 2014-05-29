"""Developer test server for the Papel editor UI.

@author: Rory Olsen (rolsen, Gleap LLC 2014)
@license: GNU GPLv3
"""
import flask
import jinja2
import codecs

# For test_structure.json
import sys
reload(sys)
sys.setdefaultencoding("utf-8")

# Create application
app = flask.Flask(__name__)

BASE_URL='http://127.0.0.1:5000'

@app.route('/')
def render():
    name = 'Papel Editor'

    def getFileContents(file_name):
        with open(file_name, 'r') as f:
            return f.read()

    application_editor = getFileContents('templates/application_editor.html')
    section = getFileContents('templates/section.html')
    subsection = getFileContents('templates/subsection.html')
    fields = getFileContents('templates/fields.html')
    components = getFileContents('templates/components.html')
    tree_view_sidebar = getFileContents('templates/tree_view_sidebar.html')
    # startup_json = getFileContents('test_structure.json')
    startup_json = getFileContents('2014-2015_School_Year.json')
    server_url = 'http://127.0.0.1:5000'
    debug = 'true'

    return flask.render_template(
        'papel_chrome.html',
        base_url=BASE_URL,
        app_title=name,
        app_name=name,
        application_editor=application_editor,
        section=section,
        subsection=subsection,
        fields=fields,
        components=components,
        tree_view_sidebar=tree_view_sidebar,
        startup_json=startup_json,
        server_url=server_url,
        debug=debug
    )

@app.route('/test')
def test():
    return flask.render_template(
        'test.html',
        base_url=BASE_URL
    )

if __name__ == '__main__':
    app.config['DEBUG'] = True
    app.run()
