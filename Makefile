.PHONY: help

NO_COLOR=\x1b[0m
OK_COLOR=\x1b[32;01m
ERROR_COLOR=\x1b[31;01m
WARN_COLOR=\x1b[33;01m

BLACK_COLOR=\x1b[30m
RED_COLOR=\x1b[31m
GREEN_COLOR=\x1b[32m
YELLOW_COLOR=\x1b[33m
BLUE_COLOR=\x1b[34m
MAGENTA_COLOR=\x1b[35m
CYAN_COLOR=\x1b[36m
WHITE_COLOR=\x1b[37m
RESET_COLOR=\x1b[0m

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install client and server side packages for development
	@echo "Installing project dependencies..."
	yarn

clean: ## Remove temporary files generated by the build and tests
	rm -rf ./coverage
	rm -rf ./build

clean-all: clean ## Remove all temporary files plus installed dependencies
	rm -rf ./node_modules

start: install clean ## Start the development server
	# yarn test
	@echo "\n\n\nStarting development server...\n\n\n"
	yarn start

build: install clean ## Build the project
	yarn build

watch: ## Build, then rebuild on changes indefinitely
	yarn watch

analyze: ## Run the webpack analyzer
	yarn analyze
	@echo "\nOpen $(MAGENTA_COLOR)http://webpack.github.io/analyse/$(RESET_COLOR) in your browser and upload the stats.json file!"
	@echo "$(BLUE_COLOR)(Tip: CMD + double-click the link!)$(RESET_COLOR)\n"
