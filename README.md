OcuPhysics
===========

Model electric field vectors with Three.js and Oculus Rift, with integrated user interaction via the Leap Motion Controller.

## <a name="setup"></a>Environment Setup

The following steps will set up the environment for the 2016 project, and is compatible with the 2015 project. Windows is recommended.

* Windows only: install **Visual Studio 2013** (make sure your install includes the Windows headers and Visual C++) and use the VS command prompt. You may need to install .NET framework 4.0 as well.
* install Firefox, Leap Motion SDK, and Oculus Rift SDK 0.3.2-preview2
* get npm by installing **node 0.10.x**
* get **node-webkit 0.8.6** (https://github.com/rogerwang/node-webkit) (DO NOT get 0.11.2+!!!! The ovr bindings don't work in it!) and put it in `$PATH`
* `npm install -g nw-gyp`
* navigate to project root directory i.e. `cd /dir/to/2015/Code Git Repository`
* get Three.js (http://threejs.org/)
* install all node modules with `npm install` in root and again in root/node-ovrsdk (no other args, reads `package.json`)
* in root/node-ovrsdk/node_modules/ffi and root/node-ovrsdk/node_modules/ref run `nw-gyp rebuild --target=0.8.6`

### some possible errors (Windows):

* WebGL will not render
Copy d3dcompiler_43.dll and D3DX9_43.dll into your node-webkit directory. These files should already be on your computer.

### Mac OSX:

We tried to set up the environment on Yosmite, but got mach-o errors, i.e. mismatching architecture. The easy solution is to use Windows. The hard solution is to make sure everything is the same architecture; 32-bit is going to be a better bet, but installers will want to give you 64-bit.

### Gentoo (TJ computers):

The Oculus code can be installed (ask a sysadmin for help if you run into problems), but we couldn't get the Leap to connect.

### other Linux:

In theory, everything should work on Ubuntu.

## <a name="run"></a>Run

Using VS 2013 command prompt in project root directory:
`nw .`
