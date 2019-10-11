FROM axsemantics/nodejs-base:node10-stretch
LABEL maintainer "AX Semantics Carpentry"

# START ONBUILD COMMANDS from axsemantics/nodejs-base:node10-stretch-onbuild
RUN chown -R node:node /opt/code
USER node
COPY package*.json /opt/code/
RUN npm ci

COPY . /opt/code
USER root
RUN find . -path ./node_modules -prune -o -exec chown node:node '{}' \;
USER node
# END ONBUILD COMMANDS

ENTRYPOINT ["npm"]
CMD ["run", "build"]
