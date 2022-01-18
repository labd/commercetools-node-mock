docker-build:
	docker build --no-cache -t labdigital/commercetools-mock-server:latest .

docker-release:
	docker push labdigital/commercetools-mock-server:latest

