.PHONY: clean check test

REPORTS = reports
LIBDIR = lib

all: node_modules lib

node_modules: package.json
#	@rm -rf node_modules
#	@npm install
	@npm update
	@touch $@

check:
	@eslint --ext .js,.jsx ./src

test: node_modules check
	@jest

clean:
	@rm -rf $(REPORTS)
	@rm -rf $(LIBDIR)

lib: clean
	@NODE_ENV=rollup rollup -c
