# Nokia EDA Workflow Resource Tool - Test Guide

## Overview
The `workflow_resource` tool has been successfully created and integrated into the MCP server. This tool provides the MCP client with comprehensive access to all Nokia EDA workflow resources, templates, troubleshooting guides, and dependency hierarchies stored in the handlers.ts file.

## Tool Details

### Tool Name: `workflow_resource`

### Tool Description
Access Nokia EDA workflow resources and documentation from the MCP resource handlers. Provides comprehensive context about EDA workflows, templates, troubleshooting guides, and dependency hierarchies.

### Input Parameters

#### `resourceUri` (optional string)
The URI of the specific workflow resource to access. Examples:
- `k8s://workflows/router-creation`
- `k8s://workflows/bridge-domain-creation`
- `k8s://workflows/irb-creation`
- `k8s://workflows/vlan-object-creation`
- `k8s://workflows/inter-vlan-routing`
- `k8s://templates/router-evpn-bgp`
- `k8s://templates/bridge-domain-evpn`
- `k8s://templates/irb-interface`
- `k8s://dependencies/eda-resource-hierarchy`
- `k8s://troubleshooting/evpn-connectivity`

#### `listAll` (optional boolean, default: false)
If true, lists all available workflow resources. When set to true, ignores the resourceUri parameter.

#### `category` (optional string, default: "all")
Filter resources by category when listAll is true. Options:
- `workflows` - Step-by-step workflow guides
- `templates` - YAML configuration templates
- `dependencies` - Resource dependency hierarchies
- `troubleshooting` - Troubleshooting and diagnostic guides
- `all` - All categories

## Usage Examples

### Example 1: List all available workflow resources
```json
{
  "name": "workflow_resource",
  "arguments": {
    "listAll": true
  }
}
```

### Example 2: Get specific workflow resource content
```json
{
  "name": "workflow_resource",
  "arguments": {
    "resourceUri": "k8s://workflows/router-creation"
  }
}
```

### Example 3: List only workflow guides
```json
{
  "name": "workflow_resource",
  "arguments": {
    "listAll": true,
    "category": "workflows"
  }
}
```

### Example 4: Get troubleshooting guide
```json
{
  "name": "workflow_resource",
  "arguments": {
    "resourceUri": "k8s://troubleshooting/evpn-connectivity"
  }
}
```

## Expected Behavior

### When called with no parameters
Returns usage information, summary of available resources, and example URIs.

### When called with `listAll: true`
Returns a JSON object containing:
- Total count of Nokia EDA workflow resources found
- Category filter applied
- Array of resources with URI, name, description, and mimeType

### When called with a specific `resourceUri`
Returns the full content of the specified resource (workflow guide, template, or troubleshooting document).

### Error Handling
- If an invalid resourceUri is provided, returns an error with a list of available resource URIs
- If resource handlers fail, returns an appropriate error message

## Benefits for MCP Client

1. **Single Tool Access**: The MCP client can access all workflow documentation through one tool instead of needing to know resource API details.

2. **Dynamic Content**: Automatically includes any future enhancements made to the handlers.ts file without requiring client updates.

3. **Comprehensive Context**: Provides complete workflow guides, templates, troubleshooting guides, and dependency hierarchies for Nokia EDA resources.

4. **Categorized Access**: Can filter resources by category to focus on specific types of documentation.

5. **Error-Friendly**: Provides helpful error messages with available options when incorrect URIs are used.

## Integration Status

✅ **Tool File Created**: `src/tools/workflow-resource.ts`
✅ **Schema Exported**: `workflowResourceSchema` 
✅ **Function Exported**: `workflowResource`
✅ **Import Added**: Added to `src/index.ts` imports
✅ **Readonly Tools**: Added to readonly tools array  
✅ **All Tools**: Added to allTools array
✅ **Handler Registered**: Added case handler in CallToolRequestSchema

## Ready for Testing
The workflow resource tool is now fully integrated and ready for the MCP client to use. It will provide comprehensive access to all the Nokia EDA workflows, templates, and troubleshooting content that was enhanced based on the previous MCP client feedback.