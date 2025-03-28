// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs").promises;
const LaunchDarkly = require("launchdarkly-node-server-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Store LaunchDarkly clients for different environments
const ldClients = {
  dev: null,
  test: null,
  prod: null,
};

// Environment-specific SDK keys from .env file
const sdkKeys = {
  dev: process.env.LD_SDK_KEY_DEV,
  test: process.env.LD_SDK_KEY_TEST,
  prod: process.env.LD_SDK_KEY_PROD,
};

// Mock feature flags for the demo - in a real application, these would be configured in LaunchDarkly
// See LAUNCHDARKLY_SETUP.md for instructions on setting up these feature flags in LaunchDarkly
const mockFlags = {
  // The config-path flag determines which configuration file path to use based on the domain name
  // This is the primary feature flag that controls the configuration selection
  "config-path": {
    // Variation 1: Dynamic path that uses variables from the context
    domain1: {
      type: "dynamic",
      pathTemplate: "${domain}/config",
      environmentPathTemplate: "${environment}/${domain}/config",
      buPathTemplate: "${environment}/${domain}/bu${buCode}/config",
      ppcPathTemplate:
        "${environment}/${domain}/bu${buCode}/ppccode${ppcCode}/config",
      description: "Dynamic configuration path based on context variables",
      priority: 1,
      variationName: "dynamic",
    },
    domain2: {
      type: "static",
      staticPath: "common/default/config1",
      description: "Static path to default configuration file",
      priority: 1,
      variationName: "static",
    },
    // Variation 2: Static path that always points to the default config file
    default: {
      type: "static",
      staticPath: "common/default/config1",
      description: "Static path to default configuration file",
      priority: 2,
      variationName: "static",
    },
  },

  // Feature flag to enable/disable features based on domain
  "feature-enabled": {
    domain1: true, // Enable the feature for domain1
    domain2: false, // Disable the feature for domain2
    default: false, // Disable by default for other domains
  },

  // Feature flag to control UI theme based on domain
  "theme-variant": {
    domain1: "modern", // Use modern theme for domain1
    domain2: "classic", // Use classic theme for domain2
    default: "standard", // Use standard theme by default
  },

  // Feature flag to control API version based on domain
  "api-version": {
    domain1: "v2", // Use API v2 for domain1
    domain2: "v1", // Use API v1 for domain2
    default: "v1", // Use API v1 by default
  },

  // Feature flag to control logging level based on domain
  "logging-level": {
    domain1: "debug", // Use debug logging for domain1
    domain2: "info", // Use info logging for domain2
    default: "error", // Use error logging by default
  },
};

// Initialize LaunchDarkly client for a specific environment
async function initLDClient(environment, customSdkKey = null) {
  if (ldClients[environment]) {
    await ldClients[environment].close();
  }

  // Use the provided SDK key or fall back to the environment-specific key from .env
  const sdkKey = customSdkKey || sdkKeys[environment] || "mock-sdk-key";

  try {
    const client = LaunchDarkly.init(sdkKey);
    await new Promise((resolve) => client.once("ready", resolve));
    ldClients[environment] = client;
    console.log(
      `LaunchDarkly client initialized for ${environment} environment`
    );
    return client;
  } catch (error) {
    console.warn(`Error initializing LaunchDarkly client: ${error.message}`);
    console.warn("Using mock feature flags instead");
    // Return a mock client that uses the mock flags
    return {
      variation: async (flagKey, context, defaultValue) => {
        console.log(`Getting mock variation for flag: ${flagKey}`);
        // Extract domain name from context
        const domainName = context.domain || "default";
        console.log(`Using domain name for flag lookup: ${domainName}`);

        // For the config-path flag, we need to handle the case where we want to use the static path
        if (flagKey === "config-path") {
          // Check if we have a specific rule for this domain
          const domainConfig = mockFlags[flagKey]?.[domainName];
          if (domainConfig) {
            console.log(
              `Found config for domain ${domainName}: ${domainConfig.type}`
            );
            return domainConfig;
          }

          // Otherwise, use the default config
          const defaultConfig = mockFlags[flagKey]?.default || defaultValue;
          console.log(`Using default config: ${defaultConfig.type}`);
          return defaultConfig;
        } else {
          // For other flags, just return the value
          const flagValue =
            mockFlags[flagKey]?.[domainName] ||
            mockFlags[flagKey]?.default ||
            defaultValue;

          console.log(`Flag ${flagKey} value for ${domainName}: ${flagValue}`);
          return flagValue;
        }
      },
      close: async () => {},
    };
  }
}

// Root route - render the form
app.get("/", (req, res) => {
  res.render("index");
});

// Handle form submission
app.post("/get-config", async (req, res) => {
  try {
    // Step 1: Extract user input from the request
    const { domain, environment, sdkKey, buCode, ppcCode } = req.body;

    // Validate required fields
    if (!domain || !environment) {
      return res
        .status(400)
        .json({ error: "Domain and environment are required" });
    }

    // Note: sdkKey, buCode, and ppcCode are optional and will be handled if provided

    console.log(
      `Processing request for domain: ${domain}, environment: ${environment}`
    );

    // Step 2: Extract domain name from the domain (e.g., extract "domain1" from "www.domain1.com")
    const domainName = domain.split(".")[1] || domain;
    console.log(`Extracted domain name: ${domainName}`);

    // Step 3: Initialize LaunchDarkly client with the appropriate SDK key
    console.log(
      `Initializing LaunchDarkly client for ${environment} environment`
    );
    const client = await initLDClient(environment, sdkKey);

    // Step 4: Create user context for LaunchDarkly
    const context = {
      kind: "user",
      key: domain,
      domain: domainName,
      buCode: buCode || "",
      ppcCode: ppcCode || "",
    };
    console.log(`Created LaunchDarkly context with domain: ${domainName}`);

    // Step 5: Use LaunchDarkly to determine which configuration path to use
    const configPathFlag = "config-path";
    let defaultPath = `${environment}/default/config`;
    let configPathObj;
    let configPath;

    try {
      // This is where LaunchDarkly determines the configuration path based on the domain
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
      console.warn(
        "Error getting configuration path from LaunchDarkly, using mock data",
        error
      );
      // Fall back to mock data
      const mockConfigObj = mockFlags[configPathFlag]?.[domainName] ||
        mockFlags[configPathFlag]?.default || {
          type: "dynamic",
          pathTemplate: "default/config",
          environmentPathTemplate: "${environment}/default/config",
          buPathTemplate: "${environment}/default/config",
          ppcPathTemplate: "${environment}/default/config",
        };

      // Check if we're using the static or dynamic variation
      if (mockConfigObj.type === "static") {
        // Static variation - use the static path directly
        configPath = mockConfigObj.staticPath;
        console.log(`Using static configuration path: ${configPath}`);
      } else {
        // Dynamic variation - determine which template to use based on available context
        let template;
        if (buCode && ppcCode) {
          template = mockConfigObj.ppcPathTemplate;
        } else if (buCode) {
          template = mockConfigObj.buPathTemplate;
        } else if (environment) {
          template = mockConfigObj.environmentPathTemplate;
        } else {
          template = mockConfigObj.pathTemplate;
        }

        // Replace variables in the template
        configPath = template
          .replace(/\${domain}/g, domainName)
          .replace(/\${environment}/g, environment)
          .replace(/\${buCode}/g, buCode || "")
          .replace(/\${ppcCode}/g, ppcCode || "");

        console.log(`Using mock configuration path template: ${template}`);
        console.log(`Resolved mock configuration path: ${configPath}`);
      }
    }

    console.log(`Final config path: ${configPath}`);

    // Step 6: Load the appropriate configuration files based on the domain, environment, etc.
    console.log(
      `Loading configuration files for domain: ${domainName}, environment: ${environment}`
    );

    // Check if we're using a static path from the feature flag
    const isStaticPath = configPathObj.type === "static";
    const configs = await loadConfigs(
      environment,
      domainName,
      buCode,
      ppcCode,
      isStaticPath ? configPath : null
    );
    console.log(
      `Loaded configuration files from: ${configs.common.source} and ${configs.environment.source}`
    );

    // Get the full running configuration that would be used by the application
    // Create a more realistic running configuration with additional derived data
    const runningConfig = {
      ...configs.merged,
      // Add derived configuration values that an application might compute
      applicationState: {
        initialized: true,
        configurationSource: configPath,
        timestamp: new Date().toISOString(),
        environment,
        domain: {
          name: domainName,
          full: domain,
        },
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
      },
      // Make the configuration look more like the example provided
      rbacApplicationName: configs.merged.rbacApplicationName || "DEFAULT_APP",
      urls: {
        ...(configs.merged.urls || {}),
        addProfile: configs.merged.urls?.addProfile || "/s/defaultProfileUrl",
        homePages: {
          ...(configs.merged.urls?.homePages || {}),
          agency:
            configs.merged.urls?.homePages?.agency || "/s/defaultAgencyPath",
          employee:
            configs.merged.urls?.homePages?.employee ||
            "/s/defaultEmployeePath",
          member:
            configs.merged.urls?.homePages?.member || "/s/defaultMemberPath",
        },
        logout: configs.merged.urls?.logout || "/s/defaultLogout",
        pageNotFound: "/s/404",
        internalServerError: "/s/500",
        noMemberProfiles: "/s/seeHealthPlans",
      },
      assets: {
        scripts: {
          analytics:
            configs.merged.assets?.scripts?.analytics ||
            `https://analytics.${domain || "example.com"}/script.js`,
        },
      },
      services: {
        events: configs.merged.services?.events || "/events",
        headerConfig: configs.merged.services?.headerConfig || "/headerConfig",
        labels: configs.merged.services?.labels || "/labels",
      },
      testConfiguration: {
        referenceFlowClientId:
          configs.merged.testConfiguration?.referenceFlowClientId ||
          "default-client-id",
      },
      oAuthClientId: configs.merged.oAuthClientId || "default-oauth-id",
      webPlanId: configs.merged.webPlanId || [217],
    };

    res.json({
      success: true,
      configPath,
      configs,
      runningConfig,
      context, // Include the context object in the response
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Load config files based on the parameters
async function loadConfigs(
  environment,
  domainName,
  buCode,
  ppcCode,
  staticPath = null
) {
  try {
    // Determine the paths for the config files
    let commonConfigPath = "public/configs/common/default/config1.json";
    let envConfigPath = `public/configs/${environment}/default/config${
      environment === "dev" ? "8" : environment === "test" ? "11" : "14"
    }.json`;

    // If a static path is provided, use it for the common config
    if (staticPath) {
      // Convert the static path to a file path
      commonConfigPath = `public/configs/${staticPath}.json`;
      console.log(`Using static path for common config: ${commonConfigPath}`);
    }
    // Otherwise, try to load domain-specific common config
    else if (domainName) {
      const domainCommonPath = `public/configs/common/${domainName}/config${
        domainName === "domain1" ? "2" : "6"
      }.json`;
      if (await fileExists(domainCommonPath)) {
        commonConfigPath = domainCommonPath;

        // Try to load BU-specific config
        if (buCode) {
          const buCommonPath = `public/configs/common/${domainName}/bu${buCode}/config${
            domainName === "domain1" && buCode === "1"
              ? "3"
              : domainName === "domain1" && buCode === "2"
              ? "5"
              : domainName === "domain2" && buCode === "3"
              ? "7"
              : ""
          }.json`;
          if (await fileExists(buCommonPath)) {
            commonConfigPath = buCommonPath;

            // Try to load PPC-specific config
            if (ppcCode) {
              const ppcCommonPath = `public/configs/common/${domainName}/bu${buCode}/ppccode${ppcCode}/config${
                domainName === "domain1" && buCode === "1" && ppcCode === "1"
                  ? "4"
                  : ""
              }.json`;
              if (await fileExists(ppcCommonPath)) {
                commonConfigPath = ppcCommonPath;
              }
            }
          }
        }
      }

      // Try to load domain-specific environment config
      const domainEnvPath = `public/configs/${environment}/${domainName}/config${
        environment === "dev" && domainName === "domain1"
          ? "9"
          : environment === "dev" && domainName === "domain2"
          ? "10"
          : environment === "test" && domainName === "domain1"
          ? "12"
          : environment === "test" && domainName === "domain2"
          ? "13"
          : environment === "prod" && domainName === "domain1"
          ? "15"
          : environment === "prod" && domainName === "domain2"
          ? "16"
          : ""
      }.json`;

      if (await fileExists(domainEnvPath)) {
        envConfigPath = domainEnvPath;
      }
    }

    console.log(`Loading common config from: ${commonConfigPath}`);
    console.log(`Loading environment config from: ${envConfigPath}`);

    // Load the config files
    const commonConfigData = JSON.parse(
      await fs.readFile(commonConfigPath, "utf8")
    );
    const envConfigData = JSON.parse(await fs.readFile(envConfigPath, "utf8"));

    // Create the config objects
    const commonConfig = {
      source: commonConfigPath,
      data: commonConfigData,
    };

    const envConfig = {
      source: envConfigPath,
      data: envConfigData,
    };

    // Merge the configs (deep merge)
    const mergedConfig = deepMerge(commonConfigData, envConfigData);
    mergedConfig._sources = {
      common: commonConfigPath,
      environment: envConfigPath,
    };

    return {
      common: commonConfig,
      environment: envConfig,
      merged: mergedConfig,
    };
  } catch (error) {
    console.error("Error loading config files:", error);
    throw new Error(`Failed to load config files: ${error.message}`);
  }
}

// Helper function to check if a file exists
async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Helper function to deep merge objects
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

// Helper function to check if value is an object
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

// Helper function to get flag value from LaunchDarkly or fall back to mock data
async function getMockOrRealFlag(client, flagKey, context, domainName) {
  // Determine the appropriate default value based on the flag key
  let defaultValue;
  switch (flagKey) {
    case "theme-variant":
      defaultValue = "standard";
      break;
    case "api-version":
      defaultValue = "v1";
      break;
    case "logging-level":
      defaultValue = "error";
      break;
    case "feature-enabled":
    default:
      defaultValue = false;
  }

  try {
    return await client.variation(flagKey, context, defaultValue);
  } catch (error) {
    console.warn(
      `Error getting flag ${flagKey} from LaunchDarkly, using mock data`,
      error
    );
    // Fall back to mock data
    return (
      mockFlags[flagKey]?.[domainName] ||
      mockFlags[flagKey]?.default ||
      defaultValue
    );
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Node.js version: ${process.version}`);
});
