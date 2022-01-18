FROM node:16-alpine


RUN adduser -D -u 8000 commercetools


USER commercetools
WORKDIR /home/commercetools

RUN \
    wget https://github.com/labd/commercetools-node-mock/archive/refs/heads/main.zip && \
    unzip main.zip && \
    mv commercetools-node-mock-main commercetools-node-mock && \
    rm -rf *.zip


WORKDIR /home/commercetools/commercetools-node-mock

RUN npm install

CMD /bin/sh

EXPOSE 8989
ENV HTTP_SERVER_PORT 8989

CMD ["npm", "run", "server"]
