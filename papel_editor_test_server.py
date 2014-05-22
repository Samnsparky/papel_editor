"""Developer test server for the Papel editor UI.

@author: Rory Olsen (rolsen, Gleap LLC 2014)
@license: GNU GPLv3
"""
import flask
import jinja2

# Create application
app = flask.Flask(__name__)

BASE_URL='http://127.0.0.1:5000'

@app.route('/')
def render():
    name = 'Papel Editor'

    def getSubHTML(file_name):
        with open(file_name, 'r') as f:
            return f.read()

    application_editor = getSubHTML('templates/application_editor.html')
    section = getSubHTML('templates/section.html')
    subsection = getSubHTML('templates/subsection.html')
    fields = getSubHTML('templates/fields.html')
    components = getSubHTML('templates/components.html')

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
