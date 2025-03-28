# Setting Up LaunchDarkly Feature Flags

This document explains how to set up the feature flags in LaunchDarkly for the Config Selector application.

## Feature Flags Overview

The application uses several feature flags to control different aspects of the application:

1. **config-path**: Determines which configuration file path to use based on the domain name
2. **feature-enabled**: Controls whether certain features are enabled or disabled
3. **theme-variant**: Controls the UI theme to use (modern, classic, or standard)
4. **api-version**: Controls which API version to use (v1 or v2)
5. **logging-level**: Controls the logging level (debug, info, or error)

## Setting Up in LaunchDarkly Dashboard

### Step 1: Create a LaunchDarkly Account

If you don't already have a LaunchDarkly account, sign up at [https://launchdarkly.com/](https://launchdarkly.com/).

### Step 2: Create a New Project

1. In the LaunchDarkly dashboard, click on "Create Project"
2. Name your project (e.g., "Config Selector")
3. Select your client-side SDK language as "JavaScript"
4. Click "Save"

### Step 3: Create the Feature Flags

#### Config Path Flag (JSON Flag with Dynamic and Static Variations)

1. In your project, click on "Feature Flags" in the left sidebar
2. Click "New Feature Flag"
3. Set the following values:
   - **Name**: Config Path
   - **Key**: config-path
   - **Description**: Determines which configuration file path to use based on the user context attributes
   - **Flag Variations**: JSON
4. Define the variations:
   - **Variation 1** (Dynamic Path):
     ```json
     {
       "type": "dynamic",
       "pathTemplate": "${domain}/config",
       "environmentPathTemplate": "${environment}/${domain}/config",
       "buPathTemplate": "${environment}/${domain}/bu${buCode}/config",
       "ppcPathTemplate": "${environment}/${domain}/bu${buCode}/ppccode${ppcCode}/config",
       "description": "Dynamic configuration path based on context variables",
       "priority": 1,
       "variationName": "dynamic"
     }
     ```
     Name = "Dynamic Path", Description = "Dynamic path based on context variables"
   - **Variation 2** (Static Default Path):
     ```json
     {
       "type": "static",
       "staticPath": "common/default/config1",
       "description": "Static path to default configuration file",
       "priority": 2,
       "variationName": "static"
     }
     ```
     Name = "Static Default Path", Description = "Static path to default configuration file"
   - Set the default variation to the "Dynamic Path" variation
5. Click "Save Flag"

> **Note**: This flag has two variations: a dynamic variation that uses variables from the context (domain, environment, buCode, ppcCode) to determine the configuration path, and a static variation that always points to the default config file. The application will use the dynamic variation to fetch the appropriate configuration file based on the context attributes, or fall back to the default config file if the static variation is selected.

#### Feature Enabled Flag (Boolean Flag)

1. Click "New Feature Flag"
2. Set the following values:
   - **Name**: Feature Enabled
   - **Key**: feature-enabled
   - **Description**: Controls whether certain features are enabled or disabled
   - **Flag Variations**: Boolean
3. The boolean flag type automatically creates two variations:
   - **Variation 1**: true (enabled)
   - **Variation 2**: false (disabled)
   - Set the default variation to false
4. Click "Save Flag"

#### Theme Variant Flag (String Flag with Multiple Variations)

1. Click "New Feature Flag"
2. Set the following values:
   - **Name**: Theme Variant
   - **Key**: theme-variant
   - **Description**: Controls the UI theme to use
   - **Flag Variations**: String
3. Define the variations:
   - Click "Add Variation" to add multiple string variations
   - **Variation 1**: Value = "modern", Name = "Modern Theme", Description = "Modern UI theme"
   - **Variation 2**: Value = "classic", Name = "Classic Theme", Description = "Classic UI theme"
   - **Variation 3**: Value = "standard", Name = "Standard Theme", Description = "Standard UI theme"
   - Set the default variation to "standard"
4. Click "Save Flag"

#### API Version Flag (String Flag with Multiple Variations)

1. Click "New Feature Flag"
2. Set the following values:
   - **Name**: API Version
   - **Key**: api-version
   - **Description**: Controls which API version to use
   - **Flag Variations**: String
3. Define the variations:
   - Click "Add Variation" to add multiple string variations
   - **Variation 1**: Value = "v1", Name = "API v1", Description = "Version 1 of the API"
   - **Variation 2**: Value = "v2", Name = "API v2", Description = "Version 2 of the API"
   - Set the default variation to "v1"
4. Click "Save Flag"

#### Logging Level Flag (String Flag with Multiple Variations)

1. Click "New Feature Flag"
2. Set the following values:
   - **Name**: Logging Level
   - **Key**: logging-level
   - **Description**: Controls the logging level
   - **Flag Variations**: String
3. Define the variations:
   - Click "Add Variation" to add multiple string variations
   - **Variation 1**: Value = "debug", Name = "Debug Level", Description = "Verbose debug logging"
   - **Variation 2**: Value = "info", Name = "Info Level", Description = "Informational logging"
   - **Variation 3**: Value = "error", Name = "Error Level", Description = "Error-only logging"
   - Set the default variation to "error"
4. Click "Save Flag"

### Step 4: Configure Targeting Rules

#### For config-path Flag (JSON Flag with Dynamic and Static Variations)

1. Click on the "config-path" flag
2. In the "Targeting" tab, click "Add Rules"
3. Create a rule for domains that should use the static default config:
   - **Name**: Default Config Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: special-domain (or any domain that should use the default config)
   - **Serve**: Select the "Static Default Path" variation
4. For all other domains, use the default "Dynamic Path" variation which will dynamically generate the path based on the context variables
5. Click "Save Changes"

> **Note**: This approach gives you two options:
>
> 1. **Dynamic Path**: Uses variables from the context to determine the configuration path, allowing for flexible configuration selection based on domain, environment, business unit code, and PPC code.
> 2. **Static Default Path**: Always points to the default config file, regardless of the context attributes. This is useful for testing or for domains that don't need custom configurations.

#### For feature-enabled Flag

1. Click on the "feature-enabled" flag
2. In the "Targeting" tab, click "Add Rules"
3. Create a rule for domain1:
   - **Name**: Domain1 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain1
   - **Serve**: true
4. Create a rule for domain2:
   - **Name**: Domain2 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain2
   - **Serve**: false
5. Click "Save Changes"

#### For theme-variant Flag

1. Click on the "theme-variant" flag
2. In the "Targeting" tab, click "Add Rules"
3. Create a rule for domain1:
   - **Name**: Domain1 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain1
   - **Serve**: "modern"
4. Create a rule for domain2:
   - **Name**: Domain2 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain2
   - **Serve**: "classic"
5. Click "Save Changes"

#### For api-version Flag

1. Click on the "api-version" flag
2. In the "Targeting" tab, click "Add Rules"
3. Create a rule for domain1:
   - **Name**: Domain1 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain1
   - **Serve**: "v2"
4. Create a rule for domain2:
   - **Name**: Domain2 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain2
   - **Serve**: "v1"
5. Click "Save Changes"

#### For logging-level Flag

1. Click on the "logging-level" flag
2. In the "Targeting" tab, click "Add Rules"
3. Create a rule for domain1:
   - **Name**: Domain1 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain1
   - **Serve**: "debug"
4. Create a rule for domain2:
   - **Name**: Domain2 Rule
   - **Attribute**: domain
   - **Operator**: is one of
   - **Values**: domain2
   - **Serve**: "info"
5. Click "Save Changes"

### Step 5: Get SDK Keys

1. Go to "Account Settings" > "Projects"
2. Find your project and click on it
3. In the "Environments" tab, you'll see SDK keys for each environment (Development, Test, Production)
4. Copy these SDK keys and add them to your `.env` file:

```
LD_SDK_KEY_DEV=your-development-sdk-key
LD_SDK_KEY_TEST=your-test-sdk-key
LD_SDK_KEY_PROD=your-production-sdk-key
```

## How the Feature Flags Work in the Application

### config-path Flag (JSON Flag with Dynamic and Static Variations)

The `config-path` flag is used to determine which configuration file to use based on the domain name, environment, business unit code, and PPC code. In the application, this is implemented in the `/get-config` endpoint:

```javascript
// Get configuration path flag
const configPathFlag = "config-path";
let defaultPath = `${environment}/default/config`;
let configPathObj;
let configPath;

try {
  // Get the JSON object from LaunchDarkly
  configPathObj = await client.variation(configPathFlag, context, {
    type: "dynamic",
    pathTemplate: "default/config",
    environmentPathTemplate: "${environment}/default/config",
    buPathTemplate: "${environment}/default/config",
    ppcPathTemplate: "${environment}/default/config",
    description: "Default dynamic configuration path",
    priority: 2,
  });

  console.log(`Got config path object from LaunchDarkly:`, configPathObj);

  // Check if we're using the static or dynamic variation
  if (configPathObj.type === "static") {
    // Static variation - use the static path directly
    configPath = configPathObj.staticPath;
    console.log(`Using static configuration path: ${configPath}`);
  } else {
    // Dynamic variation - determine which template to use based on available context
    let template;
    if (buCode && ppcCode) {
      template = configPathObj.ppcPathTemplate;
    } else if (buCode) {
      template = configPathObj.buPathTemplate;
    } else if (environment) {
      template = configPathObj.environmentPathTemplate;
    } else {
      template = configPathObj.pathTemplate;
    }

    // Replace variables in the template
    configPath = template
      .replace(/\${domain}/g, domainName)
      .replace(/\${environment}/g, environment)
      .replace(/\${buCode}/g, buCode || "")
      .replace(/\${ppcCode}/g, ppcCode || "");

    console.log(`Using configuration path template: ${template}`);
    console.log(`Resolved configuration path: ${configPath}`);
  }
} catch (error) {
  // Fall back to mock data if LaunchDarkly is not available
}
```

The application uses the domain name as the context key to determine which configuration path to use. If the domain name matches a targeting rule in LaunchDarkly, the corresponding JSON configuration object is returned. The application then:

1. Determines which template to use based on the available context (domain, environment, buCode, ppcCode)
2. Replaces variables in the template with actual values from the context
3. Uses the resulting path to load the appropriate configuration files

This approach has several advantages:

1. **Dynamic Path Generation**: The path is generated dynamically based on the context, allowing for more flexible configuration selection.
2. **Variable Substitution**: Variables like `${domain}`, `${environment}`, `${buCode}`, and `${ppcCode}` are replaced with actual values at runtime.
3. **Template Selection**: Different templates are used based on the available context, allowing for more granular configuration selection.
4. **Fallback Mechanism**: If a specific template is not available, the application falls back to a more general template.

For example, if a user selects domain "domain1", environment "dev", buCode "1", and ppcCode "1", the application will:

1. Get the JSON object from LaunchDarkly for the "domain1" domain
2. Use the `ppcPathTemplate` since both buCode and ppcCode are provided
3. Replace `${domain}` with "domain1", `${environment}` with "dev", `${buCode}` with "1", and `${ppcCode}` with "1"
4. Result in a path like "dev/domain1/bu1/ppccode1/config"
5. Use this path to load the appropriate configuration files

### Feature Flags in the Application

All feature flags are included in the running configuration to control different aspects of the application:

```javascript
flags: {
  featureEnabled: await getMockOrRealFlag(
    client,
    "feature-enabled",
    context,
    domainName
  ),
  themeVariant: await getMockOrRealFlag(
    client,
    "theme-variant",
    context,
    domainName
  ),
  apiVersion: await getMockOrRealFlag(
    client,
    "api-version",
    context,
    domainName
  ),
  loggingLevel: await getMockOrRealFlag(
    client,
    "logging-level",
    context,
    domainName
  ),
},
```

Each flag serves a different purpose:

1. **feature-enabled**: A boolean flag that controls whether certain features are enabled or disabled based on the domain name.
2. **theme-variant**: A string flag that controls the UI theme to use. Possible values are "modern", "classic", or "standard".
3. **api-version**: A string flag that controls which API version to use. Possible values are "v1" or "v2".
4. **logging-level**: A string flag that controls the logging level. Possible values are "debug", "info", or "error".

These flags demonstrate how LaunchDarkly can be used to control different aspects of an application based on the domain name or other context attributes.

## Testing Feature Flags

You can test the feature flags by:

1. Using the web interface at http://localhost:3000
2. Using the API endpoint with curl:

```
curl -X POST -H "Content-Type: application/json" -d '{"domain":"www.domain1.com", "environment":"dev", "sdkKey":"your-sdk-key"}' http://localhost:3000/get-config
```

The response will include the feature flag values in the `runningConfig.applicationState.flags` object.

## Adding More Feature Flags

To add more feature flags:

1. Create the feature flag in the LaunchDarkly dashboard
2. Add the feature flag to the `mockFlags` object in app.js for fallback
3. Use the feature flag in your application code with `client.variation(flagKey, context, defaultValue)`
