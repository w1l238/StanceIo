.PHONY: run stop

run:
	npm run dev & echo $$! > .dev.pid
	@echo "Dev server started (PID $$(cat .dev.pid))"

stop:
	@if [ -f .dev.pid ]; then \
		kill $$(cat .dev.pid) && rm .dev.pid && echo "Dev server stopped"; \
	else \
		echo "No dev server running"; \
	fi
