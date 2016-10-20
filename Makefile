check:
	./bin/jsig.js .

build:
	browserify -t brfs ui/index.js > ui/build.js

clean:
	rm ui/build.js

upload:
	git fetch --all
	git checkout gh-pages
	git rebase origin/master
	make clean
	make build
	git add --all
	git commit --amend --all --allow-empty -m 'build js code'
	git push origin gh-pages -f
	git checkout master

.PHONY: check build clean upload
