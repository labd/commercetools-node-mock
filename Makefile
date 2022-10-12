docker-build:
	docker build --no-cache -t labdigital/commercetools-mock-server:latest .

docker-release:
	docker push labdigital/commercetools-mock-server:latest

test:
	pnpm test


check:
	node_modules/typescript/bin/tsc
	pnpm run test
	pnpm run lint
