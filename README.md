OcuPhysics
===========
## <a name="setup"></a>Environment Setup
* for Windows, install **Visual Studio 2013** and use the VS command prompt
* install Firefox and the Leap Motion SDK

### node-webkit:
* get npm by installing **node 0.10.x**
* get **node-webkit 0.8.6** (https://github.com/rogerwang/node-webkit) (DO NOT get 0.11.2+!!!! The ovr bindings don't work in it!) and put it in `$PATH`
* `npm install -g nw-gyp`
* install all modules with `npm install` in root/node-ovrsdk (no other args, reads `package.json`)
* in root/node-ovrsdk/node_modules/ffi and root/node-ovrsdk/node_modules/ref run `nw-gyp rebuild --target=0.8.6`
* `nw .`

### additional things you will want:
* Three.js
* Oculus Rift SDK 0.3.2-preview2
* we used Windows 7 to run the Leap code, but you could theoretically run it on Ubuntu as well.
