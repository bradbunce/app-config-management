# VS Code Dev Container Setup Guide

This guide explains how to set up and use the VS Code Dev Container for the LaunchDarkly Config Selector demo application.

## What is a Dev Container?

Dev Containers allow you to use a Docker container as a full-featured development environment. This ensures that everyone working on the project has the same development environment, eliminating "it works on my machine" problems.

## Prerequisites

Before you begin, make sure you have the following installed:

1. [Visual Studio Code](https://code.visualstudio.com/)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop)
3. [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code

## Project Structure

After cloning the repository, your project structure should look like this:

```
launchdarkly-config-selector/
│
├── .devcontainer/
│   ├── devcontainer.json     # Dev Container configuration
│   └── Dockerfile            # Docker configuration for the container
│
├── .vscode/
│   ├── launch.json           # VS Code debugging configuration
│   └── settings.json         # VS Code editor settings
│
├── views/
│   └── index.ejs             # HTML template
│
├── app.js                    # Main application file
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Node.js dependencies
├── .gitignore                # Git ignore configuration
└── README.md                 # Project documentation
```

## Opening the Project in a Dev Container

1. Clone the repository:
   ```
   git clone <repository-url>
   cd launchdarkly-config-selector
   ```

2. Make sure to create the views directory and move the index.ejs file:
   ```
   mkdir -p views
   mv index.ejs views/
   ```

3. Open the project folder in VS Code:
   ```
   code .
   ```

4. VS Code will detect the Dev Container configuration and display a notification:
   
   ![Dev Container Notification](https://code.visualstudio.com/assets/docs/remote/containers/dev-container-reopen-prompt.png)

5. Click on "Reopen in Container" to start the container.

   If you don't see the notification, you can:
   - Click on the green icon in the bottom-left corner of VS Code
   - Select "Reopen in Container" from the command palette

6. VS Code will build the container and set up the development environment. This may take a few minutes the first time.

7. Once the container is built, VS Code will open in the container environment, and the application will start automatically.

## Using the Dev Container

When working in the Dev Container:

- The application runs on http://localhost:3000
- Changes to files are automatically detected and the application restarts
- VS Code extensions specified in devcontainer.json are pre-installed
- Debugging is configured for Node.js applications

## Debugging the Application

1. Set breakpoints in your code by clicking in the gutter next to line numbers
2. Press F5 or use the debugging tab to start debugging
3. The application will run with debugging enabled, and execution will stop at breakpoints

## Customizing the Dev Container

You can customize the Dev Container by editing:

- `.devcontainer/devcontainer.json` for VS Code settings and extensions
- `.devcontainer/Dockerfile` for container configuration
- `docker-compose.yml` for service configuration

## Stopping the Dev Container

To stop the Dev Container:

1. Click on the green icon in the bottom-left corner of VS Code
2. Select "Close Remote Connection" from the command palette

## Running Without Dev Containers

If you prefer not to use Dev Containers, you can:

1. Run with Docker Compose:
   ```
   docker-compose up
   ```

2. Run directly on your machine:
   ```
   npm install
   npm start
   ```

## Troubleshooting

### Container won't build

If the container fails to build:
- Check Docker is running
- Try restarting Docker Desktop
- Check for network issues

### Application won't start

If the application fails to start:
- Check console output for errors
- Verify that the port 3000 is not already in use
- Check that the dependencies are installed

### File changes not detected

If file changes are not detected:
- Check that nodemon is running with `--legacy-watch` for Docker compatibility
- Try restarting the container