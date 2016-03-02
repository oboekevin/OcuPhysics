OcuPhysics
===========

Model electric field vectors with Three.js and the Oculus Rift, with integrated user interaction via the Leap Motion Controller.

## <a name="setup"></a>Environment Setup

The following steps will set up the environment for the 2016 project, and is compatible with the 2015 project.

* Windows is recommended
* install **Visual Studio 2013** and use the VS command prompt
* install Firefox, Leap Motion SDK, and Oculus Rift SDK 0.3.2-preview2

### 2015/Code Git Repository:
* get npm by installing **node 0.10.x**
* get Three.js with `npm install three`
* get **node-webkit 0.8.6** (https://github.com/rogerwang/node-webkit) (DO NOT get 0.11.2+!!!! The ovr bindings don't work in it!) and put it in `$PATH`
* `npm install -g nw-gyp`
* install all modules with `npm install` in root/node-ovrsdk (no other args, reads `package.json`)
* in root/node-ovrsdk/node_modules/ffi and root/node-ovrsdk/node_modules/ref run `nw-gyp rebuild --target=0.8.6`

## <a name="run"></a>Run

Using VS 2013 command prompt in 2015/Code Git Repository:
`nw .`
