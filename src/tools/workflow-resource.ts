import { KubernetesManager } from "../types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { getResourceHandlers } from "../resources/handlers.js";

export const workflowResourceSchema = {
  name: "workflow_resource",
  description:
    "Access Nokia EDA workflow resources and documentation from the MCP resource handlers. Provides comprehensive context about EDA workflows, templates, troubleshooting guides, and dependency hierarchies.",
  inputSchema: {
    type: "object",
    properties: {
      resourceUri: {
        type: "string",
        description:
          "The URI of the workflow resource to access (e.g., 'k8s://workflows/router-creation', 'k8s://templates/router-evpn-bgp', 'k8s://troubleshooting/evpn-connectivity')",
      },
      listAll: {
        type: "boolean",
        description: "If true, lists all available workflow resources. Ignores resourceUri when true.",
        default: false,
      },
      category: {
        type: "string",
        enum: ["workflows", "templates", "dependencies", "troubleshooting", "all"],
        description: "Filter resources by category when listAll is true",
        default: "all",
      },
    },
    required: [],
  },
} as const;

export async function workflowResource(
  k8sManager: KubernetesManager,
  input: {
    resourceUri?: string;
    listAll?: boolean;
    category?: string;
  }
) {
  try {
    const resourceHandlers = getResourceHandlers(k8sManager);
    
    // If listAll is requested, return all available resources
    if (input.listAll) {
      const allResources = await resourceHandlers.listResources();
      
      // Filter Nokia EDA workflow resources based on category
      const edaResources = allResources.resources.filter(resource => {
        const uri = resource.uri;
        const category = input.category || "all";
        
        // Check if it's an EDA workflow resource
        const isEdaResource = uri.includes("workflows/") || 
                             uri.includes("templates/") || 
                             uri.includes("dependencies/") || 
                             uri.includes("troubleshooting/");
        
        if (!isEdaResource) return false;
        
        // Filter by category if specified
        if (category === "all") return true;
        if (category === "workflows" && uri.includes("workflows/")) return true;
        if (category === "templates" && uri.includes("templates/")) return true;
        if (category === "dependencies" && uri.includes("dependencies/")) return true;
        if (category === "troubleshooting" && uri.includes("troubleshooting/")) return true;
        
        return false;
      });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: `Found ${edaResources.length} Nokia EDA workflow resources`,
              category: input.category || "all",
              resources: edaResources.map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType
              }))
            }, null, 2),
          },
        ],
      };
    }
    
    // If specific resource URI is requested
    if (input.resourceUri) {
      try {
        const resourceContent = await resourceHandlers.readResource({
          params: { uri: input.resourceUri }
        });
        
        return {
          content: [
            {
              type: "text",
              text: resourceContent.contents[0].text || "No content available",
            },
          ],
        };
      } catch (error: any) {
        if (error instanceof McpError && error.code === ErrorCode.InvalidRequest) {
          // Return a helpful error with available resources
          const allResources = await resourceHandlers.listResources();
          const edaResources = allResources.resources.filter(resource => 
            resource.uri.includes("workflows/") || 
            resource.uri.includes("templates/") || 
            resource.uri.includes("dependencies/") || 
            resource.uri.includes("troubleshooting/")
          );
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Resource URI '${input.resourceUri}' not found`,
                  message: "Available Nokia EDA workflow resources:",
                  availableResources: edaResources.map(r => r.uri)
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
    
    // Default: show usage information and available resources
    const allResources = await resourceHandlers.listResources();
    const edaResources = allResources.resources.filter(resource => 
      resource.uri.includes("workflows/") || 
      resource.uri.includes("templates/") || 
      resource.uri.includes("dependencies/") || 
      resource.uri.includes("troubleshooting/")
    );
    
    const categories = {
      workflows: edaResources.filter(r => r.uri.includes("workflows/")),
      templates: edaResources.filter(r => r.uri.includes("templates/")),
      dependencies: edaResources.filter(r => r.uri.includes("dependencies/")),
      troubleshooting: edaResources.filter(r => r.uri.includes("troubleshooting/"))
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "Nokia EDA Workflow Resource Tool",
            description: "Access comprehensive EDA workflows, templates, and troubleshooting guides",
            usage: {
              listAll: "Set listAll=true to see all available resources",
              category: "Use category filter: workflows, templates, dependencies, troubleshooting, or all",
              resourceUri: "Specify a resourceUri to get specific resource content"
            },
            summary: {
              totalResources: edaResources.length,
              workflows: categories.workflows.length,
              templates: categories.templates.length,
              dependencies: categories.dependencies.length,
              troubleshooting: categories.troubleshooting.length
            },
            exampleUris: [
              "k8s://workflows/router-creation",
              "k8s://workflows/inter-vlan-routing", 
              "k8s://templates/router-evpn-bgp",
              "k8s://troubleshooting/evpn-connectivity",
              "k8s://dependencies/eda-resource-hierarchy"
            ]
          }, null, 2),
        },
      ],
    };
    
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to access workflow resource: ${error.message}`
    );
  }
}