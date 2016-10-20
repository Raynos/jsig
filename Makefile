check:
	./bin/jsig.js .

build:
	browserify -t brfs ui/index.js > ui/build.js

.PHONY: check build
