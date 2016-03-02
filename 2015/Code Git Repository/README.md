SeniorResearch2k14
==================

Reorganized senior research project

Setting up env:
* Get `npm` (comes with `node`, just install that - make sure it's 0.10.x tho)
* Get [node-webkit](https://github.com/rogerwang/node-webkit) **0.8.6** _(DO NOT get 0.11.2+!!!! The ovr bindings don't work in it!)_ and put it in `$PATH`
* Get node-gyp
    + `npm install -g nw-gyp`
* Install all modules with `npm install` (no other args, reads `package.json`)
* Run `nw-gyp rebuild --target=0.8.6` in `node-ovrsdk/node_modules/[ref,ffi]`
* Run the app
    + `nw .`
* \#lickme

For those from the future:
* You need a fairly ancient version of the Oculus Rift SDK (0.3.2-preview2 I think). Luckily, this is one of the versions before Oculus went Windows-only.
* This relies on the DK2 being 1080p. If you're trying to run this on the 1444p CV1 or greater, you'll probably have to mess around in oculus.js / renderer.js
* Also, if you're upgrading the OVRSDK, you'll need to update the native libraries in node-ovrsdk
  + The Windows and Linux libs are simple to get, but the OSX one needs to be extracted from the weird format it's in with `ar` and recompiled as a .dylib. I forget how we did this, it was with GCC IIRC. Good luck! `:^)`
* You can install all the node libs with `npm install` and it'll read from package.json.