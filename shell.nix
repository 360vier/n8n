with import <nixpkgs> { };

mkShell {
  buildInputs = [
    nodejs-16_x
  ];

	# https://github.com/webpack/webpack/issues/14532
	NODE_OPTIONS = "--openssl-legacy-provider";

  shellHook = ''
    export PATH="$(pwd)/node_modules/.bin:$PATH"

    # make sure to first install lerna globally via "npm install -g lerna@6.6.2"!
    # commands here are commented, because lerna bootstrap takes long to finish, run them manually!
    # the --save=false flag is necessary so no packages are updated, otherwise some updated @types packages will break the build.
    #npm install --save=false
    #lerna bootstrap --hoist -- --save=false
  '';
}
