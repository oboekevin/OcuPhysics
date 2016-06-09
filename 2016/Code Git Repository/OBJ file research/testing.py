# Known issues
# -Splitting by whitespace [FIXED]
# Not 60fps :"(

# Features
# Command line arguments
# MSAAx4

import pyglet, sys
from pyglet.gl import *
from random import random
# Vertices and faces
v = []
f = []

# Distance to far clipping plane
zFar = 200

# Some fluctuating variable
z = 0
inc = 1

try:
    # Try and create a window with multisampling (antialiasing)
    config = Config(sample_buffers=1, samples=4, 
                    depth_size=16, double_buffer=True,)
    win = pyglet.window.Window(resizable=True, config=config)
except pyglet.window.NoSuchConfigException:
    # Fall back to no multisampling for old hardware
    win = pyglet.window.Window(resizable=True)

@win.event
def on_resize(width, height):
    #Override the default on_resize handler to create a 3D projection
    glViewport(0, 0, width, height)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    gluPerspective(45, 1.0*width/height, 10, 300)
    return pyglet.event.EVENT_HANDLED

def update(dt):
    global z
    global inc
    if z < -5:
        z = -5
        inc = 1
    elif z > 5:
        z = 5
        inc = -1
    else:
        z += inc*dt
pyglet.clock.schedule(update)

@win.event
def on_draw():
    # Clear buffers
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

    glMatrixMode(GL_MODELVIEW)
    glLoadIdentity()

    #glBegin(GL_POLYGON)
    #glVertex3d(-0.7, -1.5, z);
    #glVertex3f( 0.7, -1.5, z);
    #glVertex3f( 0.4, -0.5, z);
    #glVertex3f(-0.4, -0.5, z);
    #glEnd()

    for face in f:
        glBegin(GL_POLYGON)
        for vertex in face:
            glVertex3d(v[vertex-1][0] + z, v[vertex-1][1], v[vertex-1][2]-zFar)
        glEnd()
        
# Export da goods
def writeFile(file):
    output = open(file, 'w')
    for vertex in v:
        line = 'v'
        for component in vertex:
            line += ' ' + str(component)
        output.write(line + '\n')
    for face in f:
        line = 'f'
        for vertex in face:
            line += ' ' + str(vertex)
        output.write(line + '\n')

def setup(obj_file='teapot.obj'):
    # One-time GL setup
    glClearColor(1, 1, 1, 1)
    glColor3f(1, 0, 0)
    glEnable(GL_DEPTH_TEST)
    #glEnable(GL_CULL_FACE)

    # Uncomment this line for a wireframe view
    glPolygonMode(GL_FRONT_AND_BACK, GL_LINE)

    # Simple light setup.  On Windows GL_LIGHT0 is enabled by default,
    # but this is not the case on Linux or Mac, so remember to always 
    # include it.
    glEnable(GL_LIGHTING)
    glEnable(GL_LIGHT0)
    glEnable(GL_LIGHT1)


    global v, f
    # OBJ interpreting
    obj = file(obj_file, 'r')
    for line in obj:
        data = line.split()
        if len(data) > 0 and data[0] == 'v':
            v += [[float(stng) for stng in data[1:]]]
        elif len(data) > 0 and data[0] == 'f':
            f += [[int(stng) for stng in data[1:]]]

if __name__ == '__main__':
    if len(sys.argv) == 1:
        setup()
    if len(sys.argv) == 2:
        setup(sys.argv[1])
    if len(sys.argv) == 3:
        setup(sys.argv[1])
        zFar = float(sys.argv[2])
    pyglet.app.run()
