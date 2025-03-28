# LaunchDarkly Config Selector

A sample application that demonstrates how to use LaunchDarkly to control which configuration file an application would use when initializing, based on the domain name of the user.

## Overview

This application allows you to select a configuration file based on:

1. Domain name (e.g., www.domain1.com)
2. Environment (dev, test, prod)
3. Business Unit Code (optional)
4. PPC Code (optional)

The application uses LaunchDarkly to determine which configuration file to use, and falls back to a default configuration if LaunchDarkly is not available or if the feature flag is not defined.

## Directory Structure

The configuration files are organized in a hierarchical structure:

```
public/configs/
├── common/
│   ├── default/
│   │   └── config1.json
│   ├── domain1/
│   │   ├── config2.json
│   │   ├── bu1/
│   │   │   ├── config3.json
│   │   │   ├── ppccode1/
│   │   │   │   └── config4.json
│   │   ├── bu2/
│   │   │   └── config5.json
│   ├── domain2/
│   │   ├── config6.json
│   │   ├── bu3/
│   │   │   └── config7.json
├── dev/
│   ├── default/
│   │   └── config8.json
│   ├── domain1/
│   │   └── config9.json
│   ├── domain2/
│   │   └── config10.json
├── test/
│   ├── default/
│   │   └── config11.json
│   ├── domain1/
│   │   └── config12.json
│   ├── domain2/
│   │   └── config13.json
└── prod/
    ├── default/
    │   └── config14.json
    ├── domain1/
    │   └── config15.json
    ├── domain2/
    │   └── config16.json
```

## Configuration Selection Logic

The application selects configuration files based on the following logic:

1. **Common Configuration**:

   - Starts with the default common configuration
   - If a domain-specific common configuration exists, it uses that
   - If a business unit-specific configuration exists, it uses that
   - If a PPC code-specific configuration exists, it uses that

2. **Environment Configuration**:

   - Starts with the default environment configuration
   - If a domain-specific environment configuration exists, it uses that

3. **Merged Configuration**:
   - The common and environment configurations are merged, with environment values taking precedence

## LaunchDarkly Integration

The application uses LaunchDarkly to determine which configuration file to use. The LaunchDarkly SDK key can be provided in three ways:

1. Through the web interface (optional)
2. Through environment variables in the `.env` file:
   - `LD_SDK_KEY_DEV` for the development environment
   - `LD_SDK_KEY_TEST` for the test environment
   - `LD_SDK_KEY_PROD` for the production environment
3. If no SDK key is provided, the application falls back to mock feature flags

## Feature Flags

The application uses the following feature flags:

- `config-path`: Determines the path to the configuration file to use based on the domain name, environment, business unit code, and PPC code
- `feature-enabled`: Controls whether certain features are enabled or disabled
- `theme-variant`: Controls the UI theme to use (modern, classic, or standard)
- `api-version`: Controls which API version to use (v1 or v2)
- `logging-level`: Controls the logging level (debug, info, or error)

For detailed instructions on setting up these feature flags in LaunchDarkly, see [LAUNCHDARKLY_SETUP.md](LAUNCHDARKLY_SETUP.md).

## Running the Application

1. Install dependencies:

   ```
   npm install
   ```

2. Set up environment variables in a `.env` file:

   ```
   LD_SDK_KEY_DEV=sdk-key-for-dev-environment
   LD_SDK_KEY_TEST=sdk-key-for-test-environment
   LD_SDK_KEY_PROD=sdk-key-for-prod-environment
   ```

3. Start the application:

   ```
   npm start
   ```

4. Open a web browser and navigate to `http://localhost:3000`

## API Endpoints

### GET /

Renders the web interface.

### POST /get-config

Retrieves the configuration based on the provided parameters.

**Request Body**:

```json
{
  "domain": "www.domain1.com",
  "environment": "dev",
  "sdkKey": "optional-sdk-key",
  "buCode": "optional-bu-code",
  "ppcCode": "optional-ppc-code"
}
```

**Response**:

```json
{
  "success": true,
  "configPath": "path/to/config",
  "configs": {
    "common": { ... },
    "environment": { ... },
    "merged": { ... }
  },
  "runningConfig": { ... }
}
```

## Technologies Used

- Node.js
- Express.js
- LaunchDarkly SDK
- EJS (Embedded JavaScript templates)
- Bootstrap 5
