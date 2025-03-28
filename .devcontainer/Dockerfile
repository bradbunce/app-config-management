FROM node:18

# Install extra tools that might be useful
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install git curl nano vim

# Set up a working directory
WORKDIR /workspaces/app

# We don't need to copy package.json since it will be mounted
# from the host via the volume in docker-compose.yml

# Ensure proper permissions for the working directory
RUN mkdir -p /workspaces/app/node_modules && \
  chown -R node:node /workspaces/app

# Set up a non-root user
USER node

# Expose port 3000
EXPOSE 3000

# We'll use the command from docker-compose.yml instead
