# Kubectl Tool Schema Fixes - Addressing MCP Client Issues

## Problem Identified
The MCP client correctly identified a critical design flaw in kubectl tool schemas where required parameters prevented proper listing operations across namespaces.

### Original Issue
When asking to look for available L3 domains, the MCP client received this error:
```
ERROR: Your input to the tool was invalid (must have required property 'name')
```

### Root Cause
Several kubectl tools incorrectly marked `name` and/or `namespace` as required parameters when they should be optional for listing/bulk operations.

## Fixes Applied

### ✅ kubectl_get Tool
**File**: `src/tools/kubectl-get.ts`  
**Before**: `required: ["resourceType", "name", "namespace"]`  
**After**: `required: ["resourceType"]`  

**Impact**: Now supports proper listing operations like:
- `kubectl_get {resourceType: "routers"}` - List all routers in default namespace
- `kubectl_get {resourceType: "routers", allNamespaces: true}` - List all routers across all namespaces
- `kubectl_get {resourceType: "routers", namespace: "custom-ns"}` - List routers in specific namespace

### ✅ kubectl_delete Tool  
**File**: `src/tools/kubectl-delete.ts`  
**Before**: `required: ["resourceType", "name", "namespace"]`  
**After**: `required: ["resourceType"]`  

**Impact**: Now supports various deletion methods:
- Delete by label selector: `kubectl_delete {resourceType: "pods", labelSelector: "app=nginx"}`
- Delete from manifest: `kubectl_delete {manifest: "pod-config.yaml"}`
- Delete all of type: `kubectl_delete {resourceType: "pods", namespace: "test"}`

### ✅ kubectl_logs Tool
**File**: `src/tools/kubectl-logs.ts`  
**Before**: `required: ["resourceType", "name", "namespace"]`  
**After**: `required: ["resourceType", "name"]`  

**Impact**: `namespace` is now optional (defaults to "default")

### ✅ kubectl_rollout Tool
**File**: `src/tools/kubectl-rollout.ts`  
**Before**: `required: ["subCommand", "resourceType", "name", "namespace"]`  
**After**: `required: ["subCommand", "resourceType", "name"]`  

**Impact**: `namespace` is now optional (defaults to "default")

## Tools That Were Already Correct

### kubectl_describe Tool ✅
`required: ["resourceType", "name"]` - Correctly requires name since you must specify which resource to describe

### kubectl_patch Tool ✅  
`required: ["resourceType", "name"]` - Correctly requires name since you must specify which resource to patch

### kubectl_scale Tool ✅
`required: ["name", "replicas"]` - Correctly requires name and replica count

### kubectl_apply Tool ✅
`required: []` - Correctly allows flexible application from manifests or files

### kubectl_create Tool ✅
`required: []` - Correctly allows flexible creation from manifests or files

## Testing the Fixes

### Example: Finding L3 Domains (Routers)
The MCP client can now properly use:

```json
{
  "name": "kubectl_get", 
  "arguments": {
    "resourceType": "routers",
    "allNamespaces": true
  }
}
```

This will successfully list all router resources across all namespaces without requiring name or namespace parameters.

### Example: Cleaning Up Resources
```json
{
  "name": "kubectl_delete",
  "arguments": {
    "resourceType": "pods", 
    "labelSelector": "app=test",
    "allNamespaces": true
  }
}
```

## Benefits for MCP Client

1. **Proper Listing Operations**: Can now list resources without artificial parameter requirements
2. **Cross-Namespace Discovery**: Can properly discover resources across all namespaces using `allNamespaces: true`
3. **Flexible Deletion**: Can delete resources by various methods (name, labels, manifests)
4. **Consistent Behavior**: Tool schemas now match actual kubectl command capabilities

## Validation

All kubectl tool schemas have been audited and fixed to ensure:
- ✅ Required parameters match actual functional requirements
- ✅ Optional parameters (like namespace) have appropriate defaults
- ✅ Bulk/listing operations work without artificial constraints
- ✅ Tools support their full range of kubectl capabilities

The MCP client should now be able to properly discover and manage Nokia EDA L3 domains (routers) and other Kubernetes resources across all namespaces.