import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { KubernetesManager } from "../types.js";

export const getResourceHandlers = (k8sManager: KubernetesManager) => ({
  listResources: async () => {
    return {
      resources: [
        {
          uri: "k8s://default/pods",
          name: "Kubernetes Pods",
          mimeType: "application/json",
          description: "List of pods in the default namespace",
        },
        {
          uri: "k8s://default/deployments",
          name: "Kubernetes Deployments",
          mimeType: "application/json",
          description: "List of deployments in the default namespace",
        },
        {
          uri: "k8s://default/services",
          name: "Kubernetes Services",
          mimeType: "application/json",
          description: "List of services in the default namespace",
        },
        {
          uri: "k8s://namespaces",
          name: "Kubernetes Namespaces",
          mimeType: "application/json",
          description: "List of all namespaces",
        },
        {
          uri: "k8s://nodes",
          name: "Kubernetes Nodes",
          mimeType: "application/json",
          description: "List of all nodes in the cluster",
        },
        
        // Nokia EDA Custom Resource Workflows
        {
          uri: "k8s://workflows/router-creation",
          name: "Router Resource Creation Workflow",
          description: "Complete workflow for creating EVPN-VXLAN Router resources with BGP configuration",
          mimeType: "text/markdown"
        },
        {
          uri: "k8s://workflows/bridge-domain-creation",
          name: "Bridge Domain Creation Workflow", 
          description: "Step-by-step process for creating EVPN-VXLAN Bridge Domains",
          mimeType: "text/markdown"
        },
        {
          uri: "k8s://workflows/irb-creation",
          name: "IRB Interface Creation Workflow",
          description: "Creating IRB interfaces that connect Bridge Domains to Routers",
          mimeType: "text/markdown"
        },
        {
          uri: "k8s://workflows/vlan-object-creation",
          name: "VLAN and Interface Configuration Workflow",
          description: "Configuring VLANs and Interfaces for layer 2 connectivity",
          mimeType: "text/markdown"
        },
        {
          uri: "k8s://workflows/inter-vlan-routing",
          name: "Inter-VLAN Routing Complete Setup",
          description: "End-to-end workflow for setting up inter-VLAN routing with EVPN",
          mimeType: "text/markdown"
        },
        
        // Dependencies and Relationships
        {
          uri: "k8s://dependencies/eda-resource-hierarchy",
          name: "Nokia EDA Resource Dependency Hierarchy",
          description: "Understanding relationships between Router, IRB, Bridge Domain, VLAN, and Interface resources",
          mimeType: "text/markdown"
        },
        
        // Configuration Templates
        {
          uri: "k8s://templates/router-evpn-bgp",
          name: "Router EVPN-VXLAN with BGP Template",
          description: "Complete Router configuration template with EVPN and BGP settings",
          mimeType: "text/yaml"
        },
        {
          uri: "k8s://templates/bridge-domain-evpn",
          name: "Bridge Domain EVPN Template",
          description: "Bridge Domain configuration for EVPN-VXLAN overlay",
          mimeType: "text/yaml"
        },
        {
          uri: "k8s://templates/irb-interface",
          name: "IRB Interface Template",
          description: "IRB interface configuration template with anycast gateway",
          mimeType: "text/yaml"
        },
        
        // Troubleshooting Guides
        {
          uri: "k8s://troubleshooting/evpn-connectivity",
          name: "EVPN Connectivity Troubleshooting Guide",
          description: "Systematic approach to diagnosing EVPN overlay connectivity issues",
          mimeType: "text/markdown"
        },
      ],
    };
  },

  readResource: async (request: { params: { uri: string } }) => {
    try {
      const uri = request.params.uri;
      const parts = uri.replace("k8s://", "").split("/");

      const isNamespaces = parts[0] === "namespaces";
      const isNodes = parts[0] === "nodes";
      if ((isNamespaces || isNodes) && parts.length === 1) {
        const fn = isNodes ? "listNode" : "listNamespace";
        const { items } = await k8sManager.getCoreApi()[fn]();
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(items, null, 2),
            },
          ],
        };
      }

      const [namespace, resourceType] = parts;

      switch (resourceType) {
        case "pods": {
          const { items } = await k8sManager
            .getCoreApi()
            .listNamespacedPod({ namespace });
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: "application/json",
                text: JSON.stringify(items, null, 2),
              },
            ],
          };
        }
        case "deployments": {
          const { items } = await k8sManager
            .getAppsApi()
            .listNamespacedDeployment({ namespace });
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: "application/json",
                text: JSON.stringify(items, null, 2),
              },
            ],
          };
        }
        case "services": {
          const { items } = await k8sManager
            .getCoreApi()
            .listNamespacedService({ namespace });
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: "application/json",
                text: JSON.stringify(items, null, 2),
              },
            ],
          };
        }
      }

      // Nokia EDA Resource Handlers
      
      // Router Creation Workflow
      if (uri === "k8s://workflows/router-creation") {
        const workflow = `
# Router Resource Creation Workflow

## Overview
Creates an EVPN-VXLAN Router (L3 Domain) with BGP configuration for inter-VLAN routing.

## Prerequisites
- Namespace exists and is accessible
- Required pools configured: evi-pool, tunnel-index-pool, vni-pool
- BGP autonomous system number planned
- Verify RBAC permissions for Router resources

## Step 1: Plan Router Configuration

### Required Decisions:
- **Router Name**: Descriptive name (e.g., \`ipvrf4748\`, \`l3-domain-1\`)
- **Type**: EVPNVXLAN (for overlay networking)
- **BGP AS Number**: Unique AS for this router (e.g., 65001, 65002)
- **Description**: Purpose and scope of the router

### BGP Configuration Options:
- **autonomousSystem**: BGP AS number (required)
- **enabled**: true (enable BGP routing)
- **ebgpPreference**: 170 (external BGP preference)
- **ibgpPreference**: 170 (internal BGP preference)
- **ipv4Unicast**: Enable IPv4 unicast routing
- **multipath**: Allow multiple paths (maxAllowedPaths: 4)

## Step 2: Create Router Resource

\`\`\`bash
# Use kubectl_apply with Router manifest
kubectl apply -f router-config.yaml
\`\`\`

### Example Router Configuration:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: Router
metadata:
  name: ipvrf4748
  namespace: clab-clabmcp
spec:
  description: "L3 domain for inter-VLAN routing"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  bgp:
    autonomousSystem: 65002
    enabled: true
    ebgpPreference: 170
    ibgpPreference: 170
    ipv4Unicast:
      enabled: true
      multipath:
        allowMultipleAS: false
        maxAllowedPaths: 4
    minWaitToAdvertise: 0
    rapidWithdrawl: true
    waitForFIBInstall: false
\`\`\`

## Step 3: Systematic Router Status Analysis

### Immediate Status Check Pattern:
\`\`\`bash
# 1. Check operational state immediately after creation
kubectl get router <router-name> -o jsonpath='{.status.operationalState}'

# 2. Get detailed status for analysis
kubectl get router <router-name> -o yaml

# 3. Check critical status fields
kubectl get router <router-name> -o jsonpath='{.status.numNodes}'
kubectl get router <router-name> -o jsonpath='{.status.irbInterfaces}'

# 4. Compare with working routers (find working examples)
kubectl get routers --all-namespaces -o jsonpath='{range .items[?(@.status.operationalState=="up")]}{.metadata.name}: {.status.operationalState}, nodes: {.status.numNodes}, irbs: {.status.irbInterfaces}{"\n"}{end}'
\`\`\`

### Success Indicators Analysis:
- \`operationalState: up\` ✅
- \`evi\`: Allocated from evi-pool ✅
- \`vni\`: Allocated from vni-pool ✅
- \`exportTarget/importTarget\`: Route targets configured ✅
- \`nodes\`: List of fabric nodes where router is active ✅
- \`numNodes > 0\`: Router deployed on fabric nodes ✅
- \`irbInterfaces: []\`: Empty initially - IRBs added later ✅

### Critical Warning Signs:
- \`operationalState: down\` ❌ - Router not operational
- \`numNodes: 0\` ❌ - Router not deployed on any fabric nodes
- Missing \`evi\`, \`vni\`, or route targets ❌ - Pool allocation failed

### Systematic Comparison Pattern:
\`\`\`bash
# Find a working router for comparison
WORKING_ROUTER=$(kubectl get routers --all-namespaces -o jsonpath='{.items[?(@.status.operationalState=="up")].metadata.name}' | head -1)

# Compare configurations side by side
echo "=== WORKING ROUTER: $WORKING_ROUTER ==="
kubectl get router $WORKING_ROUTER -o yaml | grep -A 20 "status:"

echo "=== NEW ROUTER: <router-name> ==="
kubectl get router <router-name> -o yaml | grep -A 20 "status:"
\`\`\`

## Step 4: Note Router Details for IRB Creation

Record these values for subsequent IRB interface creation:
- **Router name**: \`<router-name>\`
- **Router namespace**: \`<namespace>\`
- **EVI**: \`<allocated-evi>\`
- **VNI**: \`<allocated-vni>\`
- **Route Targets**: \`<export-target>\` and \`<import-target>\`

## Common Issues & Troubleshooting

### Router Stuck in Pending/Down State:
- Check pool availability (evi-pool, vni-pool, tunnel-index-pool)
- Verify namespace and RBAC permissions
- Check fabric node connectivity

### BGP Issues:
- Verify AS number uniqueness in fabric
- Check BGP peering configuration on fabric nodes
- Ensure route-reflector configuration is correct

### Resource Allocation Failures:
- Check pool exhaustion: \`kubectl get <pool-name> -o yaml\`
- Verify pool ranges don't overlap with existing allocations
- Check controller logs for allocation errors

## Next Steps
After router creation, proceed to:
1. Create Bridge Domains (Layer 2 domains)
2. Create IRB Interfaces (connect L2 to L3)
3. Configure VLANs and Interfaces
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: workflow }]
        };
      }

      // Bridge Domain Creation Workflow  
      if (uri === "k8s://workflows/bridge-domain-creation") {
        const workflow = `
# Bridge Domain Creation Workflow

## Overview
Creates EVPN-VXLAN Bridge Domains for Layer 2 connectivity within VLANs. This object is sometimes referred to as L2 domain or mac-vrf.

## Prerequisites
- Namespace exists and is accessible
- Required pools configured: evi-pool, tunnel-index-pool, vni-pool
- Understand VLAN design and segmentation requirements
- Plan bridge domain naming convention

## Step 1: Plan Bridge Domain Configuration

### Required Decisions:
- **Bridge Domain Name**: Descriptive name (e.g., \`my47bd\`, \`bd-vlan100\`)
- **Type**: Choose between SIMPLE or EVPNVXLAN
  - **SIMPLE**: Local bridge domain (single node)
  - **EVPNVXLAN**: Distributed bridge domain (multi-node overlay)
- **Description**: Purpose and VLAN association
- **MAC Aging**: MAC address aging timeout (default: 300 seconds)

### Type Selection Guidelines:
- Use **EVPNVXLAN** for:
  - Multi-node connectivity
  - Overlay networking requirements
  - EVPN route advertisement needs
- Use **SIMPLE** for:
  - Single-node local bridging
  - Simple L2 switching without overlay

## Step 2: Create Bridge Domain Resource

\`\`\`bash
# Use kubectl_apply with Bridge Domain manifest
kubectl apply -f bridge-domain-config.yaml
\`\`\`

### Example EVPN Bridge Domain:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeDomain
metadata:
  name: my47bd
  namespace: clab-clabmcp
spec:
  description: "Bridge domain for VLAN 47"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  macAging: 300
\`\`\`

### Example Simple Bridge Domain:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeDomain
metadata:
  name: bd-simple-local
  namespace: clab-clabmcp
spec:
  description: "Simple local bridge domain"
  type: SIMPLE
  macAging: 300
\`\`\`

## Step 3: Verify Bridge Domain Status

1. **Check operational state**: \`kubectl get bridgedomain <name> -o yaml\`
2. **Verify resource allocation**: Check EVI, VNI assignments (EVPNVXLAN only)
3. **Monitor nodes**: Confirm bridge domain deployment
4. **Check sub-interfaces**: Verify interface attachments

### Success Indicators:
- \`operationalState: up\`
- \`evi\`: Allocated EVI number (EVPNVXLAN only)
- \`vni\`: Allocated VNI number (EVPNVXLAN only)
- \`exportTarget/importTarget\`: Route targets (EVPNVXLAN only)
- \`nodes\`: Fabric nodes where bridge domain is active
- \`numSubInterfaces\`: Number of attached interfaces

## Step 4: Note Bridge Domain Details

Record these values for VLAN and IRB creation:
- **Bridge Domain name**: \`<bridge-domain-name>\`
- **Type**: SIMPLE or EVPNVXLAN
- **EVI**: \`<allocated-evi>\` (if EVPNVXLAN)
- **VNI**: \`<allocated-vni>\` (if EVPNVXLAN)

## Common Issues & Troubleshooting

### Bridge Domain Down State:
- No interfaces attached: Bridge domains need VLANs/interfaces
- Pool exhaustion: Check evi-pool and vni-pool availability
- Node connectivity: Verify fabric node status

### Resource Allocation Issues:
- EVI/VNI conflicts: Check for duplicate allocations
- Pool configuration: Verify pool ranges and availability
- Controller errors: Check operator logs

### Type Mismatch Problems:
- SIMPLE vs EVPNVXLAN: Ensure type matches intended use case
- Cannot change type: Bridge domain type is immutable after creation

## Next Steps

After creating the Bridge Domain, you must choose **one** of the following methods to associate interfaces with the Bridge Domain:

### Option 1: Use the \`VLAN\` Resource (Recommended for Multiple Interfaces)

- Suitable when you need to attach **multiple interfaces** using **label selectors**
- Allows dynamic grouping of interfaces via label matching
- More scalable and declarative

Example:

\`\`\`yaml
spec:
  vlanID: "47"
  interfaceSelector:
    - vlangroup=30
\`\`\`

### Option 2: Use the \`BridgeInterface\` Resource (One Interface at a Time)

- Requires **manual creation** for each individual interface
- Useful for **explicit one-to-one mappings**

Example:

\`\`\`yaml
spec:
  bridgeDomain: bd20
  description: Bridge interface for VLAN 20 on dc1-leaf2
  interface: dc1-leaf2-ethernet-1-1
  vlanID: \'20\'
\`\`\`

### Optional: Create \`IRB\` Interfaces for L3 Connectivity

If L3 routing is required for this Bridge Domain, you can optionally define IRB interfaces.

Example:

\`\`\`yaml
spec:
  description: 'IRB interface that links BridgeDomain br30 with Router myl3domain'
  bridgeDomain: br30
  router: myl3domain
\`\`\`
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: workflow }]
        };
      }

      // IRB Creation Workflow
      if (uri === "k8s://workflows/irb-creation") {
        const workflow = `
# IRB Interface Creation Workflow

## Overview
Creates IRB (Integrated Routing and Bridging) interfaces that connect Layer 2 Bridge Domains to Layer 3 Routers for inter-VLAN routing.

## Prerequisites
- **Router resource** must exist and be operational
- **Bridge Domain resource** must exist and be operational  
- Plan IP addressing scheme for IRB interfaces
- Understand anycast gateway requirements

## Step 1: Gather Prerequisites

### Router Information:
\`\`\`bash
# Get router details
ROUTER_NAME="ipvrf4748"
ROUTER_NAMESPACE="clab-clabmcp"
kubectl get router $ROUTER_NAME -n $ROUTER_NAMESPACE -o yaml
\`\`\`

### Bridge Domain Information:
\`\`\`bash
# Get bridge domain details  
BD_NAME="my47bd"
BD_NAMESPACE="clab-clabmcp"
kubectl get bridgedomain $BD_NAME -n $BD_NAMESPACE -o yaml
\`\`\`

## Step 2: Plan IRB Configuration

### Required Decisions:
- **IRB Name**: Descriptive name (e.g., \`irb-vlan47\`, \`irb-vlan100\`)
- **IP Address**: Gateway IP with CIDR (e.g., \`192.168.47.1/24\`)
- **Primary IP**: Set primary flag for the main gateway IP
- **ARP Timeout**: ARP entry timeout (default: 14400 seconds)
- **IP MTU**: Maximum transmission unit (default: 1400)

### IP Planning Guidelines:
- Use first usable IP in subnet as gateway (e.g., .1, .254)
- Ensure IP doesn't conflict with client assignments
- Plan for anycast gateway (same IP on multiple nodes)
- Consider subnet size for client capacity

### MTU Configuration Guidelines:
- **CRITICAL**: IRB interface IP MTU must be **smaller** than the bridge domain MTU
- **Recommended**: Set IRB IP MTU to be 20-50 bytes less than bridge domain MTU
- **Example**: If bridge domain supports 1500 byte frames, set IRB IP MTU to 1450-1480
- **Reason**: Allows proper packet forwarding without fragmentation between L2 and L3 domains
- **Default**: IRB IP MTU defaults to 1400, which works well with standard 1500-byte bridge domain MTU

#### MTU Planning Steps:
1. **Check bridge domain MTU**: Bridge domains typically inherit from physical interface MTU
2. **Calculate IRB MTU**: Subtract 20-50 bytes from bridge domain MTU
3. **Consider EVPN overhead**: VXLAN adds ~50 bytes of overhead
4. **Test connectivity**: Verify large packets can traverse without fragmentation

## Step 3: Create IRB Interface

### Check Bridge Domain MTU First:
\`\`\`bash
# Check bridge domain configuration to determine appropriate IRB MTU
kubectl get bridgedomain $BD_NAME -n $BD_NAMESPACE -o yaml | grep -i mtu

# If no explicit MTU, check physical interface MTU
kubectl get interface <interface-name> -o yaml | grep -i mtu
\`\`\`

\`\`\`bash
# Use kubectl_apply with IRB manifest
kubectl apply -f irb-config.yaml
\`\`\`

### Example IRB Configuration:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: IRBInterface
metadata:
  name: irb-vlan47
  namespace: clab-clabmcp
spec:
  bridgeDomain: my47bd              # Reference to Bridge Domain
  router: ipvrf4748                 # Reference to Router
  description: "IRB interface for VLAN 47"
  arpTimeout: 14400
  ipMTU: 1400
  learnUnsolicited: "NONE"
  ipAddresses:
  - ipv4Address:
      ipPrefix: 192.168.47.1/24     # Gateway IP address
      primary: true                 # Primary gateway flag
\`\`\`

## Step 4: Systematic IRB Dependency Tree Validation

### Dependency Tree Analysis Pattern:
\`\`\`bash
# 1. Immediate status check after IRB creation
kubectl get irbinterface <irb-name> -o jsonpath='{.status.operationalState}'

# 2. Validate complete dependency chain
echo "=== DEPENDENCY VALIDATION ==="

# Check Router (upstream dependency)
echo "Router Status:"
kubectl get router <router-name> -o jsonpath='State: {.status.operationalState}, Nodes: {.status.numNodes}, IRBs: {.status.irbInterfaces}'
echo ""

# Check Bridge Domain (downstream dependency)
echo "Bridge Domain Status:"
kubectl get bridgedomain <bridge-domain-name> -o jsonpath='State: {.status.operationalState}, Nodes: {.status.nodes}, SubInterfaces: {.status.numSubInterfaces}'
echo ""

# Check IRB Interface (the connection)
echo "IRB Interface Status:"
kubectl get irbinterface <irb-name> -o yaml | grep -A 10 "status:"

# 3. Cross-reference: Does router list this IRB?
echo "=== CROSS-REFERENCE VALIDATION ==="
echo "Router's IRB list:"
kubectl get router <router-name> -o jsonpath='{.status.irbInterfaces}'
echo "Should include: <irb-name>"
\`\`\`

### Systematic Dependency Validation Checklist:
✅ **Router Prerequisites**:
- Router \`operationalState: up\`
- Router \`numNodes > 0\` (deployed on fabric)
- Router BGP configuration valid

✅ **Bridge Domain Prerequisites**:
- Bridge Domain \`operationalState: up\`
- Bridge Domain has \`nodes\` populated
- Bridge Domain type supports L3 integration (EVPNVXLAN)

✅ **IRB Interface Status**:
- IRB \`operationalState: up\`
- IRB appears in router's \`irbInterfaces\` list
- IRB has \`interfaces[]\` populated (per-node instances)

### Working Example Discovery Pattern:
\`\`\`bash
# Find working IRB interfaces for comparison
echo "=== WORKING IRB EXAMPLES ==="
kubectl get irbinterfaces --all-namespaces -o jsonpath='{range .items[?(@.status.operationalState=="up")]}{.metadata.name}: router={.spec.router}, bd={.spec.bridgeDomain}, state={.status.operationalState}{"\n"}{end}'

# Compare with a working example
WORKING_IRB=$(kubectl get irbinterfaces --all-namespaces -o jsonpath='{.items[?(@.status.operationalState=="up")].metadata.name}' | head -1)
if [ ! -z "$WORKING_IRB" ]; then
    echo "=== WORKING IRB COMPARISON: $WORKING_IRB ==="
    kubectl get irbinterface $WORKING_IRB -o yaml | grep -A 15 "status:"
fi
\`\`\`

### Success Indicators:
- \`operationalState: up\`
- \`interfaces[]\`: List of node-specific IRB interfaces
- Each interface shows:
  - \`enabled: true\`
  - \`operationalState: up\`
  - \`ipv4Addresses\`: Configured IP addresses
  - \`node\`: Node where interface is active
  - \`nodeInterface\`: Physical interface name (e.g., irb0.2)

## Step 5: Verify Router Integration

Check that IRB is listed in router status:
\`\`\`bash
kubectl get router ipvrf4748 -o yaml | grep -A 10 irbInterfaces
\`\`\`

Should show IRB in router's interface list:
\`\`\`yaml
status:
  irbInterfaces:
  - irb-vlan47
  - irb-vlan48
\`\`\`

## Common Issues & Troubleshooting

### IRB Interface Down:
- **Router not ready**: Verify router operationalState is 'up'
- **Bridge domain not ready**: Check bridge domain status
- **Reference errors**: Verify router and bridge domain names are correct

### IP Configuration Issues:
- **IP conflicts**: Check for duplicate IP assignments
- **Subnet misconfigurations**: Verify CIDR notation is correct
- **MTU problems**: Ensure IP MTU is appropriate for network

### MTU Configuration Issues:
- **IRB MTU too large**: IRB IP MTU must be smaller than bridge domain MTU
- **Packet fragmentation**: Large packets fail due to MTU mismatch
- **Performance degradation**: Sub-optimal MTU sizes cause fragmentation overhead
- **Resolution**: Set IRB IP MTU 20-50 bytes smaller than bridge domain MTU

### Cross-Reference Failures:
- **Namespace mismatches**: Verify all resources in same namespace
- **Resource not found**: Check resource names and existence
- **RBAC issues**: Verify permissions for cross-resource references

### Anycast Gateway Issues:
- **Inconsistent IPs**: Ensure same IP configured on all relevant IRBs
- **Node-specific problems**: Check individual node interface status
- **MAC address conflicts**: Verify anycast MAC configuration

## Testing IRB Functionality

### Test 1: Gateway Reachability
\`\`\`bash
# From client in same VLAN
ping 192.168.47.1
\`\`\`

### Test 2: Inter-VLAN Routing
\`\`\`bash
# From client in VLAN 47 to client in VLAN 48
ping 192.168.48.30
\`\`\`

### Test 3: Route Advertisement
\`\`\`bash
# Check EVPN routes are advertised
kubectl logs -n <controller-namespace> <evpn-controller-pod>
\`\`\`

### Test 4: MTU Validation
\`\`\`bash
# Test large packet transmission to verify MTU configuration
ping -s 1450 -c 3 192.168.47.1    # Test with large packet size
ping -s 1400 -c 3 192.168.48.30   # Test inter-VLAN with large packets

# If packets are fragmented or fail, reduce IRB IP MTU:
# kubectl patch irbinterface irb-vlan47 --type='merge' -p='{"spec":{"ipMTU":1350}}'
\`\`\`

## Next Steps
After IRB creation:
1. Configure static routes on clients pointing to IRB gateway
2. Test inter-VLAN connectivity
3. Monitor EVPN route advertisement
4. Implement additional IRBs for other VLANs as needed
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: workflow }]
        };
      }

      // VLAN and Interface Configuration Workflow
      if (uri === "k8s://workflows/vlan-object-creation") {
        const workflow = `
# VLAN creation workflow. Once a bridge domain is created it can be made operational by creating BridgeInterface objects one by one or by creating a vlan object and using labels in the interfaceSelector attribute of the vlan object.

## Overview
Configure VLANs using VLAN ID, select interfaces with interface labels(interfaceSelector) and attach the vlan to an existing BridgeDomain

## Prerequisites
- **Bridge Domain** must exist and be operational
- **Interface resources** must exist with proper encapsulation and metadata.labels.
- Understand VLAN ID allocation and interface mapping
- Plan interfacelabel-to-VLAN assignments

## Step 1: Verify Interface Readiness

### Check Interface Configuration:
\`\`\`bash
# List available interfaces
kubectl get interfaces -n <namespace>

# Check specific interface details
kubectl get interface <interface-name> -o yaml

# Check the Labels associated with the interface
kubectl get interface <interface-name> -o jsonpath="{.metadata.labels}

# Search for interfaces by name pattern (use proper field selector syntax)
kubectl get interfaces -n <namespace> --field-selector metadata.name=<interface name>

# Or list all and filter with grep
kubectl get interfaces -n <namespace> | grep dc1-leaf1
\`\`\`

### Interface Requirements:
- **encapType**: Must be \`dot1q\` for VLAN tagging
- **operationalState**: Must be \`up\`
- **labels**: Check role labels (e.g., \`eda.nokia.com/role=edge\`)

### Example Interface Check:
\`\`\`yaml
spec:
  encapType: dot1q        # Required for VLAN tagging
  enabled: true
  type: interface
status:
  operationalState: up    # Must be operational
\`\`\`

## Step 2: Plan VLAN Configuration

### Required Decisions:
- **VLAN ID**: Unique VLAN identifier (1-4094), If a VLAN ID is not provided you may use an existing vlan pool from IndexAllocationPool within the same namespace
- **VLAN Name**: Descriptive name (e.g., \`vlan47-dc1-leaf1\`)
- **Bridge Domain**: Target bridge domain for this VLAN
- **Interface Selection**: Interfaces to include in this VLAN are selected based on the labels present on the interface resource. Ask the user to provide the label information if it is not already provided.

### CRITICAL Configuration Notes:
⚠️ **VLAN ID Type**: VLAN ID MUST be specified as a string, not integer
- ✅ **Correct**: \`vlanID: "47"\`
- ❌ **Wrong**: \`vlanID: 47\` (will cause validation error)

⚠️ **Interface Selector Format**: Use simple array format, not matchLabels
- ✅ **Correct**: \`interfaceSelector: - eda.nokia.com/role=edge\`
- ❌ **Wrong**: \`interfaceSelector: {matchLabels: {...}}\` (will cause parsing error)

### VLAN Naming Convention:
- Include VLAN ID: \`VLAN50\`
- Be descriptive: \`VLAN 50\`

## Step 3: Create VLAN Resource

\`\`\`bash
# Use kubectl_apply with VLAN manifest
kubectl apply -f vlan-config.yaml
\`\`\`

### Example VLAN Configuration:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: VLAN
metadata:
  name: VLAN50
  namespace: clab-clabmcp
spec:
  bridgeDomain: my47bd                    # Reference to Bridge Domain
  vlanID: "50"                           # VLAN identifier (MUST be string, not integer)
  interfaceSelector:                     # Interface selection is based on labels and not the interface names. Ensure you provide one or more labels to filter the interfaces.
  - vlangroup=50
\`\`\`


## Step 4: Verify VLAN and Bridge Interface Status

### Check VLAN Status:
\`\`\`bash
kubectl get vlan <vlan-name> -o yaml
\`\`\`

### Check Bridge Interface Status:
\`\`\`bash
kubectl get bridgeinterface <bridge-interface-name> -o yaml
\`\`\`

### Success Indicators:
- VLAN created successfully (no errors in describe)
- Bridge Interface shows:
  - \`operationalState: up\`
  - \`subInterfaces[]\`: Active sub-interface details
  - \`nodeInterface\`: Physical interface with VLAN (e.g., ethernet-1/1.47)

## Step 5: Verify Bridge Domain Integration

Check that VLAN/Interface is attached to bridge domain:
\`\`\`bash
kubectl get bridgedomain <bd-name> -o yaml | grep -A 5 numSubInterfaces
\`\`\`

Should show increased interface count:
\`\`\`yaml
status:
  numSubInterfaces: 2                # Number of attached interfaces
  numSubInterfacesOperDown: 0        # Should be 0 for healthy state
  nodes:                            # Nodes where BD is active
  - dc1-leaf1
  - dc1-leaf2
\`\`\`

## Common Issues & Troubleshooting

### VLAN Creation Failures:
- **Invalid VLAN ID type**: VLAN ID must be string, not integer (\`vlanID: "47"\` not \`vlanID: 47\`)
- **Invalid VLAN ID range**: Check range (1-4094) and uniqueness
- **Bridge Domain reference**: Verify bridge domain exists and is accessible
- **Interface selector errors**: If the BridgeDomain was created using VLANs then interfaceSelector should be the metadata.labels of the interface resources. 
- **Invalid interfaceSelector format**: Use simple array, not matchLabels structure

### Common YAML Validation Errors:
\`\`\`yaml
# ❌ WRONG - These will cause validation errors:
spec:
  vlanID: 47                           # Integer instead of string
  interfaceSelector:
    matchLabels:                       # Invalid structure
      name: dc1-leaf1-ethernet-1-1

# ✅ CORRECT - Proper format:
spec:
  vlanID: "47"                         # String value
  interfaceSelector:                   # Simple array of labels
  - vlangroup=30
\`\`\`

### Bridge Interface Issues:
- **Interface not found**: Verify interface name and namespace
- **Encapsulation mismatch**: Ensure interface has \`encapType: dot1q\`
- **VLAN conflicts**: Check for duplicate VLAN ID on same interface

### Interface Down States:
- **Physical interface down**: Check interface operationalState
- **Configuration errors**: Verify VLAN ID and bridge domain references
- **Node connectivity**: Check fabric node health

### Bridge Domain Not Learning:
- **No traffic**: Ensure clients are sending traffic
- **MAC aging**: Check MAC aging timer configuration
- **VLAN mismatch**: Verify client VLAN configuration matches

## Testing Layer 2 Connectivity

### Test 1: Interface Status
\`\`\`bash
# Check all interfaces in bridge domain
kubectl get bridgeinterface -n <namespace>
\`\`\`

### Test 2: Client Connectivity (Same VLAN)
\`\`\`bash
# From client 1 to client 2 in same VLAN
ping <client-2-ip>
\`\`\`

### Test 3: MAC Learning
\`\`\`bash
# Check bridge domain MAC table (if available)
kubectl describe bridgedomain <bd-name>
\`\`\`

## Next Steps
After VLAN/Interface configuration:
1. Configure client devices with appropriate VLAN tags
2. Test Layer 2 connectivity within VLAN
3. Create IRB interfaces for inter-VLAN routing (if needed)
4. Configure additional VLANs as required
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: workflow }]
        };
      }

      // Inter-VLAN Routing Complete Setup
      if (uri === "k8s://workflows/inter-vlan-routing") {
        const workflow = `
# Complete Inter-VLAN Routing Setup Workflow

## Overview
End-to-end workflow for implementing inter-VLAN routing using EVPN-VXLAN with Nokia EDA resources.

## Architecture Overview
\`\`\`
Client A (VLAN 47) ↔ Bridge Domain A ↔ IRB Interface A ↔ Router (L3 Domain) ↔ IRB Interface B ↔ Bridge Domain B ↔ Client B (VLAN 48)
\`\`\`

## Prerequisites
- Nokia EDA fabric operational
- Required pools configured (evi-pool, vni-pool, tunnel-index-pool)
- Physical interfaces configured with dot1q encapsulation
- Client IP addressing plan
- BGP autonomous system planning

## Step 1: Create L3 Router Domain

\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: Router
metadata:
  name: ipvrf4748
  namespace: clab-clabmcp
spec:
  description: "L3 domain for inter-VLAN routing"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  bgp:
    autonomousSystem: 65002
    enabled: true
    ebgpPreference: 170
    ibgpPreference: 170
    ipv4Unicast:
      enabled: true
      multipath:
        allowMultipleAS: false
        maxAllowedPaths: 4
    minWaitToAdvertise: 0
    rapidWithdrawl: true
    waitForFIBInstall: false
\`\`\`

## Step 2: Create Bridge Domains (One per VLAN)

### Bridge Domain for VLAN 47:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeDomain
metadata:
  name: my47bd
  namespace: clab-clabmcp
spec:
  description: "Bridge domain for VLAN 47"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  macAging: 300
\`\`\`

### Bridge Domain for VLAN 48:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeDomain
metadata:
  name: my48bd
  namespace: clab-clabmcp
spec:
  description: "Bridge domain for VLAN 48"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  macAging: 300
\`\`\`

## Step 3: Create VLANs and Bridge Interfaces

### VLAN 47 Configuration:
\`\`\`yaml
# VLAN 47
apiVersion: services.eda.nokia.com/v1alpha1
kind: VLAN
metadata:
  name: vlan47-dc1-leaf1
  namespace: clab-clabmcp
spec:
  bridgeDomain: my47bd
  vlanID: "47"                           # MUST be string, not integer
  interfaceSelector:                     # Simple array of interface names
  - dc1-leaf1-ethernet-1-1
---
# Bridge Interface for VLAN 47
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeInterface
metadata:
  name: dc1-leaf1-vlan47-bridge
  namespace: clab-clabmcp
spec:
  bridgeDomain: my47bd
  interface: dc1-leaf1-ethernet-1-1
  vlanID: "47"
  description: "Bridge interface for VLAN 47 on dc1-leaf1"
\`\`\`

### VLAN 48 Configuration:
\`\`\`yaml
# VLAN 48
apiVersion: services.eda.nokia.com/v1alpha1
kind: VLAN
metadata:
  name: vlan48-dc1-leaf3
  namespace: clab-clabmcp
spec:
  bridgeDomain: my48bd
  vlanID: "48"                           # MUST be string, not integer
  interfaceSelector:                     # Simple array of interface names
  - dc1-leaf3-ethernet-1-1
---
# Bridge Interface for VLAN 48
apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeInterface
metadata:
  name: dc1-leaf3-vlan48-bridge
  namespace: clab-clabmcp
spec:
  bridgeDomain: my48bd
  interface: dc1-leaf3-ethernet-1-1
  vlanID: "48"
  description: "Bridge interface for VLAN 48 on dc1-leaf3"
\`\`\`

## Step 4: Create IRB Interfaces (L2-L3 Bridging)

### IRB for VLAN 47:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: IRBInterface
metadata:
  name: irb-vlan47
  namespace: clab-clabmcp
spec:
  bridgeDomain: my47bd                    # Links to VLAN 47 bridge domain
  router: ipvrf4748                       # Links to L3 router domain
  description: "IRB interface for VLAN 47"
  arpTimeout: 14400
  ipMTU: 1400
  learnUnsolicited: "NONE"
  ipAddresses:
  - ipv4Address:
      ipPrefix: 192.168.47.1/24           # Anycast gateway for VLAN 47
      primary: true
\`\`\`

### IRB for VLAN 48:
\`\`\`yaml
apiVersion: services.eda.nokia.com/v1alpha1
kind: IRBInterface
metadata:
  name: irb-vlan48
  namespace: clab-clabmcp
spec:
  bridgeDomain: my48bd                    # Links to VLAN 48 bridge domain
  router: ipvrf4748                       # Links to L3 router domain
  description: "IRB interface for VLAN 48"
  arpTimeout: 14400
  ipMTU: 1400
  learnUnsolicited: "NONE"
  ipAddresses:
  - ipv4Address:
      ipPrefix: 192.168.48.1/24           # Anycast gateway for VLAN 48
      primary: true
\`\`\`

## Step 5: Verify Resource Creation and Status

### Check Router Status:
\`\`\`bash
kubectl get router ipvrf4748 -o yaml
# Verify: operationalState: up, irbInterfaces list
\`\`\`

### Check Bridge Domains:
\`\`\`bash
kubectl get bridgedomain my47bd my48bd -o yaml
# Verify: operationalState: up, nodes populated, subInterfaces count
\`\`\`

### Check IRB Interfaces:
\`\`\`bash
kubectl get irbinterface irb-vlan47 irb-vlan48 -o yaml
# Verify: operationalState: up, interfaces list populated
\`\`\`

## Step 6: Configure Client Devices

### Client in VLAN 47:
\`\`\`bash
# Configure client with VLAN 47 interface
ip link add link eth1 name eth1.47 type vlan id 47
ip addr add 192.168.47.10/24 dev eth1.47
ip link set eth1.47 up

# Add route to VLAN 48 via IRB gateway
ip route add 192.168.48.0/24 via 192.168.47.1 dev eth1.47
\`\`\`

### Client in VLAN 48:
\`\`\`bash
# Configure client with VLAN 48 interface
ip link add link eth1 name eth1.48 type vlan id 48
ip addr add 192.168.48.30/24 dev eth1.48
ip link set eth1.48 up

# Add route to VLAN 47 via IRB gateway
ip route add 192.168.47.0/24 via 192.168.48.1 dev eth1.48
\`\`\`

## Step 7: Test Inter-VLAN Connectivity

### Test 1: Gateway Reachability
\`\`\`bash
# From VLAN 47 client
ping 192.168.47.1    # Local gateway

# From VLAN 48 client  
ping 192.168.48.1    # Local gateway
\`\`\`

### Test 2: Inter-VLAN Communication
\`\`\`bash
# From VLAN 47 client to VLAN 48 client
ping 192.168.48.30

# From VLAN 48 client to VLAN 47 client
ping 192.168.47.10
\`\`\`

### Expected Results:
- TTL should be decremented (253) indicating routing
- Low latency (sub-millisecond for local fabric)
- 0% packet loss for successful routing

## Troubleshooting Guide

### Issue: Inter-VLAN ping fails

#### Step 1: Check Layer 2 connectivity
\`\`\`bash
# Test same-VLAN connectivity first
# VLAN 47: ping between clients in same VLAN
# VLAN 48: ping between clients in same VLAN
\`\`\`

#### Step 2: Check IRB gateway reachability
\`\`\`bash
# From each client, ping its local gateway
ping 192.168.47.1    # From VLAN 47 client
ping 192.168.48.1    # From VLAN 48 client
\`\`\`

#### Step 3: Check routing configuration
\`\`\`bash
# Verify routing table on clients
ip route show
# Should show routes to other VLANs via IRB gateways
\`\`\`

#### Step 4: Check EVPN routes
\`\`\`bash
# Check router status for IRB interfaces
kubectl get router ipvrf4748 -o yaml | grep -A 10 irbInterfaces
\`\`\`

### Issue: Bridge domain down

#### Check interface attachments:
\`\`\`bash
kubectl get bridgeinterface -n clab-clabmcp
# Ensure bridge interfaces are UP
\`\`\`

#### Check physical interfaces:
\`\`\`bash
kubectl get interface -n clab-clabmcp
# Verify operationalState: up and encapType: dot1q
\`\`\`

## Performance Optimization

### BGP Tuning:
- Adjust \`minWaitToAdvertise\` for faster convergence
- Configure appropriate \`maxAllowedPaths\` for ECMP
- Enable \`rapidWithdrawl\` for fast route withdrawal

### MAC Learning:
- Tune \`macAging\` timeout based on client behavior
- Configure \`learnUnsolicited\` appropriately

### MTU Considerations:
- **Critical**: Set IRB \`ipMTU\` smaller than bridge domain MTU (20-50 bytes less)
- **EVPN/VXLAN overhead**: Account for ~50 bytes of VXLAN encapsulation overhead
- **End-to-end path**: Ensure consistent MTU sizing across entire L2/L3 path
- **Testing**: Use large ping tests to validate MTU configuration

## Monitoring and Validation

### Check EVPN route advertisement:
\`\`\`bash
# Monitor BGP EVPN routes (controller logs)
kubectl logs -n <eda-namespace> <controller-pod>
\`\`\`

### Monitor traffic flow:
\`\`\`bash
# Check interface statistics
kubectl describe interface <interface-name>
\`\`\`

### Validate end-to-end connectivity:
\`\`\`bash
# Comprehensive connectivity test
for dst in 192.168.47.10 192.168.48.30; do
    echo "Testing connectivity to $dst"
    ping -c 3 $dst
done
\`\`\`

This workflow provides complete inter-VLAN routing using EVPN-VXLAN overlay with anycast gateways for optimal performance and redundancy.
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: workflow }]
        };
      }

      // Resource Dependencies Guide
      if (uri === "k8s://dependencies/eda-resource-hierarchy") {
        const dependencies = `
# Nokia EDA Resource Dependency Hierarchy

## Overview
Understanding the relationships and dependencies between Nokia EDA custom resources for proper creation order and troubleshooting.

## Resource Hierarchy (Creation Order)

\`\`\`
1. Physical Infrastructure
   ├── Interfaces (physical ports with encapsulation)
   │
2. Layer 2 Infrastructure  
   ├── Bridge Domains (L2 domains)
   ├── Interface Association (choose one method):
   │   ├── VLANs (VLAN to Bridge Domain mapping with label selectors)
   │   └── Bridge Interfaces (Direct Interface to Bridge Domain attachment)
   └── IRB Interfaces (optional: connect Bridge Domain to Layer 3 Router)
   │
3. Layer 3 Infrastructure
   ├── Routers (L3 domains with BGP)
   └── IRB Interfaces (L2-L3 bridge via Router and Bridge Domain)
   │
4. Client Configuration
   └── Client interfaces and routing
\`\`\`

## Resource Relationships

### 1. Interface → VLAN → Bridge Interface → Bridge Domain
\`\`\`yaml
Interface:
  encapType: dot1q                # Required for VLAN tagging
  operationalState: up
    ↓
VLAN:
  interfaceSelector: [interface]  # References Interface(s)
  bridgeDomain: bridge-domain     # References Bridge Domain
    ↓
Bridge Interface:
  interface: interface            # References Interface
  bridgeDomain: bridge-domain     # References Bridge Domain
  vlanID: "47"                    # VLAN tag
    ↓
Bridge Domain:
  type: EVPNVXLAN                # L2 domain type
  operationalState: up
\`\`\`

### 2. Bridge Domain → IRB Interface → Router
\`\`\`yaml
Bridge Domain:
  type: EVPNVXLAN               # Must support L3 integration
  operationalState: up
    ↓
IRB Interface:
  bridgeDomain: bridge-domain   # References Bridge Domain (L2 side)
  router: router                # References Router (L3 side)
  ipAddresses: [gateway-ip]     # Anycast gateway IP
    ↓
Router:
  type: EVPNVXLAN              # L3 domain
  bgp: enabled                 # BGP for route advertisement
  irbInterfaces: [irb-list]    # Lists attached IRB interfaces
\`\`\`

## Dependency Rules

### Interface Dependencies:
- **Must exist first**: Physical interfaces are foundation
- **Required properties**: \`encapType: dot1q\`, \`operationalState: up\`
- **Labeling**: Use labels like \`eda.nokia.com/role: edge\` for identification

### Bridge Domain Dependencies:
- **Independent creation**: Can be created without interfaces initially
- **Type selection**: EVPNVXLAN for multi-node, SIMPLE for single-node
- **Pool requirements**: evi-pool, vni-pool, tunnel-index-pool must exist

### VLAN Dependencies:
- **Bridge Domain**: Must exist and be operational
- **Interface Selector**: Interfaces must exist with \`dot1q\` encapsulation
- **VLAN ID uniqueness**: Per interface, VLAN IDs must be unique

### Bridge Interface Dependencies:
- **Interface**: Must exist and be operational
- **Bridge Domain**: Must exist and be operational  
- **VLAN ID**: Must match VLAN resource if using VLANs

### Router Dependencies:
- **Independent creation**: Can be created before IRB interfaces
- **BGP Configuration**: Autonomous system must be unique in fabric
- **Pool resources**: evi-pool, vni-pool, tunnel-index-pool required

### IRB Interface Dependencies:
- **Bridge Domain**: Must exist and be operational (EVPNVXLAN type)
- **Router**: Must exist and be operational
- **IP Planning**: Gateway IPs must not conflict with client assignments

## Creation Sequence Best Practices

### Phase 1: Foundation (Can be parallel)
1. Verify/create physical **Interfaces**
2. Create **Bridge Domains**
3. Create **Router**

### Phase 2: Layer 2 Connectivity (Sequential)
1. Create **VLANs** (references Bridge Domains and Interfaces)
2. Create **Bridge Interfaces** (attaches Interfaces to Bridge Domains)
3. Verify Bridge Domain has active subInterfaces

### Phase 3: Layer 3 Integration (Sequential)
1. Create **IRB Interfaces** (bridges Bridge Domains to Router)
2. Verify Router shows IRB interfaces in status
3. Verify IRB interfaces are operational on fabric nodes

### Phase 4: Client Configuration
1. Configure client VLAN interfaces
2. Set client IP addresses
3. Configure routing via IRB gateways

## Advanced Resource Relationship Discovery

### Complete Dependency Tree Analysis:
\`\`\`bash
# 1. Map complete resource relationships for a given resource
map_resource_dependencies() {
    local RESOURCE_TYPE=$1
    local RESOURCE_NAME=$2
    
    echo "=== RESOURCE DEPENDENCY MAP: $RESOURCE_TYPE/$RESOURCE_NAME ==="
    
    case $RESOURCE_TYPE in
        "router")
            echo "Router Dependencies:"
            kubectl get router $RESOURCE_NAME -o jsonpath='BGP AS: {.spec.bgp.autonomousSystem}, Pools: {.spec.eviPool}, {.spec.vniPool}'
            echo ""
            echo "Router Dependents (IRB Interfaces):"
            kubectl get irbinterfaces --all-namespaces -o jsonpath='{range .items[?(@.spec.router=="'$RESOURCE_NAME'")]}{.metadata.name} (namespace: {.metadata.namespace}){"\n"}{end}'
            ;;
        "bridgedomain")
            echo "Bridge Domain Dependencies:"
            kubectl get bridgedomain $RESOURCE_NAME -o jsonpath='Type: {.spec.type}, Pools: {.spec.eviPool}, {.spec.vniPool}'
            echo ""
            echo "Bridge Domain Dependents:"
            echo "VLANs:"
            kubectl get vlans --all-namespaces -o jsonpath='{range .items[?(@.spec.bridgeDomain=="'$RESOURCE_NAME'")]}{.metadata.name} (VLAN: {.spec.vlanID}){"\n"}{end}'
            echo "Bridge Interfaces:"
            kubectl get bridgeinterfaces --all-namespaces -o jsonpath='{range .items[?(@.spec.bridgeDomain=="'$RESOURCE_NAME'")]}{.metadata.name} (interface: {.spec.interface}){"\n"}{end}'
            echo "IRB Interfaces:"
            kubectl get irbinterfaces --all-namespaces -o jsonpath='{range .items[?(@.spec.bridgeDomain=="'$RESOURCE_NAME'")]}{.metadata.name} (router: {.spec.router}){"\n"}{end}'
            ;;
        "irbinterface")
            echo "IRB Interface Dependencies:"
            kubectl get irbinterface $RESOURCE_NAME -o jsonpath='Router: {.spec.router}, Bridge Domain: {.spec.bridgeDomain}'
            echo ""
            echo "Cross-reference validation:"
            local ROUTER=$(kubectl get irbinterface $RESOURCE_NAME -o jsonpath='{.spec.router}')
            local BD=$(kubectl get irbinterface $RESOURCE_NAME -o jsonpath='{.spec.bridgeDomain}')
            echo "Router $ROUTER lists IRBs: $(kubectl get router $ROUTER -o jsonpath='{.status.irbInterfaces}')"
            echo "Bridge Domain $BD status: $(kubectl get bridgedomain $BD -o jsonpath='{.status.operationalState}')"
            ;;
    esac
}

# Usage examples:
# map_resource_dependencies "router" "mynewl3"
# map_resource_dependencies "bridgedomain" "bd-vlan5" 
# map_resource_dependencies "irbinterface" "irb-vlan5"
\`\`\`

### Resource Health Status Dashboard:
\`\`\`bash
# Complete system health overview
resource_health_dashboard() {
    echo "=== NOKIA EDA RESOURCE HEALTH DASHBOARD ==="
    
    echo "🔍 ROUTERS:"
    kubectl get routers --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,STATE:.status.operationalState,NODES:.status.numNodes,IRBS:.status.irbInterfaces
    
    echo ""
    echo "🌐 BRIDGE DOMAINS:" 
    kubectl get bridgedomains --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,STATE:.status.operationalState,TYPE:.spec.type,INTERFACES:.status.numSubInterfaces,NODES:.status.nodes
    
    echo ""
    echo "🔗 IRB INTERFACES:"
    kubectl get irbinterfaces --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,STATE:.status.operationalState,ROUTER:.spec.router,BRIDGE_DOMAIN:.spec.bridgeDomain
    
    echo ""
    echo "🏷️  VLANS:"
    kubectl get vlans --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,VLAN_ID:.spec.vlanID,BRIDGE_DOMAIN:.spec.bridgeDomain
    
    echo ""
    echo "🔌 BRIDGE INTERFACES:"
    kubectl get bridgeinterfaces --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,INTERFACE:.spec.interface,BRIDGE_DOMAIN:.spec.bridgeDomain,VLAN:.spec.vlanID
}
\`\`\`

### Working Configuration Discovery:
\`\`\`bash
# Find complete working configurations to use as templates
find_working_l3_domain() {
    echo "=== WORKING L3 DOMAIN CONFIGURATIONS ==="
    
    # Find operational routers with IRB interfaces
    kubectl get routers --all-namespaces -o jsonpath='{range .items[?(@.status.operationalState=="up")]}{.metadata.name} (namespace: {.metadata.namespace}, IRBs: {.status.irbInterfaces}){"\n"}{end}' | grep -v "IRBs: \[\]"
    
    # Get complete working configuration
    local WORKING_ROUTER=$(kubectl get routers --all-namespaces -o jsonpath='{.items[?(@.status.operationalState=="up" && @.status.irbInterfaces[0])].metadata.name}' | head -1)
    
    if [ ! -z "$WORKING_ROUTER" ]; then
        echo ""
        echo "=== COMPLETE WORKING L3 DOMAIN: $WORKING_ROUTER ==="
        
        # Router config
        echo "Router Configuration:"
        kubectl get router $WORKING_ROUTER -o yaml | grep -A 20 "spec:"
        
        # Associated IRB interfaces
        echo ""
        echo "Associated IRB Interfaces:"
        kubectl get irbinterfaces --all-namespaces -o jsonpath='{range .items[?(@.spec.router=="'$WORKING_ROUTER'")]}{.metadata.name}: bridge_domain={.spec.bridgeDomain}, ip={.spec.ipAddresses[0].ipv4Address.ipPrefix}{"\n"}{end}'
        
        # Associated Bridge Domains
        echo ""
        echo "Associated Bridge Domains:"
        kubectl get irbinterfaces --all-namespaces -o jsonpath='{range .items[?(@.spec.router=="'$WORKING_ROUTER'")]}{.spec.bridgeDomain}{"\n"}{end}' | sort -u | while read BD; do
            echo "  $BD: $(kubectl get bridgedomain $BD -o jsonpath='{.status.operationalState}')"
        done
    fi
}
\`\`\`

## Lifecycle Management

### Safe Deletion Order (Reverse of creation):
1. Remove client configurations
2. Delete **IRB Interfaces**
3. Delete **Bridge Interfaces** 
4. Delete **VLANs**
5. Delete **Bridge Domains**
6. Delete **Router** (if no longer needed)
7. Interface cleanup (if needed)

### Resource Updates:
- **Bridge Domain type**: Cannot be changed after creation
- **VLAN ID**: Can be updated but may cause traffic disruption
- **IRB IP addresses**: Can be updated but verify client routing
- **Router BGP config**: Can be updated but may affect routing

## Common Dependency Errors

### "Bridge Domain not found":
- Bridge Domain doesn't exist or wrong namespace
- Bridge Domain not yet operational

### "Interface not found":
- Interface doesn't exist or wrong name
- Interface not configured with dot1q encapsulation

### "Router reference invalid":
- Router doesn't exist or wrong namespace
- Router not yet operational

### "VLAN ID conflict":
- Duplicate VLAN ID on same interface
- VLAN/Bridge Interface VLAN ID mismatch

## Validation Checklist

Before creating dependent resources, verify:

✅ **Interfaces**: operationalState: up, encapType: dot1q
✅ **Bridge Domains**: operationalState: up, type appropriate
✅ **Router**: operationalState: up, BGP configured
✅ **Namespace**: All resources in same namespace
✅ **Names**: Exact name matches in references
✅ **Pools**: Required pools exist and have capacity

This hierarchy ensures proper resource creation order and helps troubleshoot dependency-related issues.
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: dependencies }]
        };
      }

      // Router Template
      if (uri === "k8s://templates/router-evpn-bgp") {
        const template = `
# Router EVPN-VXLAN with BGP Template

apiVersion: services.eda.nokia.com/v1alpha1
kind: Router
metadata:
  name: {{ router-name }}
  namespace: {{ namespace }}
  annotations:
    description: "{{ description }}"
spec:
  description: "{{ description }}"
  type: EVPNVXLAN
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  bgp:
    autonomousSystem: {{ bgp-as-number }}
    enabled: true
    ebgpPreference: 170
    ibgpPreference: 170
    ipv4Unicast:
      enabled: true
      multipath:
        allowMultipleAS: false
        maxAllowedPaths: 4
    minWaitToAdvertise: 0
    rapidWithdrawl: true
    waitForFIBInstall: false

---
# Template Variables:
# {{ router-name }}: Name for the router (e.g., ipvrf4748, l3-domain-prod)
# {{ namespace }}: Kubernetes namespace (e.g., clab-clabmcp)
# {{ description }}: Human-readable description
# {{ bgp-as-number }}: BGP autonomous system number (e.g., 65001, 65002)

# Example Usage:
# router-name: ipvrf4748
# namespace: clab-clabmcp
# description: "L3 domain for inter-VLAN routing between VLAN 47 and 48"
# bgp-as-number: 65002
        `;
        
        return {
          contents: [{ uri, mimeType: "text/yaml", text: template }]
        };
      }

      // Bridge Domain Template
      if (uri === "k8s://templates/bridge-domain-evpn") {
        const template = `
# Bridge Domain EVPN Template

apiVersion: services.eda.nokia.com/v1alpha1
kind: BridgeDomain
metadata:
  name: {{ bridge-domain-name }}
  namespace: {{ namespace }}
spec:
  description: "{{ description }}"
  type: {{ type }}
  eviPool: evi-pool
  tunnelIndexPool: tunnel-index-pool
  vniPool: vni-pool
  macAging: {{ mac-aging-timeout }}

---
# Template Variables:
# {{ bridge-domain-name }}: Name for bridge domain (e.g., my47bd, bd-vlan100)
# {{ namespace }}: Kubernetes namespace (e.g., clab-clabmcp)
# {{ description }}: Human-readable description
# {{ type }}: EVPNVXLAN or SIMPLE
# {{ mac-aging-timeout }}: MAC aging timeout in seconds (default: 300)

# Example for EVPN Bridge Domain:
# bridge-domain-name: my47bd
# namespace: clab-clabmcp
# description: "Bridge domain for VLAN 47 client access"
# type: EVPNVXLAN
# mac-aging-timeout: 300

# Example for Simple Bridge Domain:
# bridge-domain-name: bd-local-simple
# namespace: clab-clabmcp
# description: "Simple local bridge domain"
# type: SIMPLE
# mac-aging-timeout: 300
        `;
        
        return {
          contents: [{ uri, mimeType: "text/yaml", text: template }]
        };
      }

      // IRB Interface Template  
      if (uri === "k8s://templates/irb-interface") {
        const template = `
# IRB Interface Template

apiVersion: services.eda.nokia.com/v1alpha1
kind: IRBInterface
metadata:
  name: {{ irb-name }}
  namespace: {{ namespace }}
spec:
  bridgeDomain: {{ bridge-domain-name }}
  router: {{ router-name }}
  description: "{{ description }}"
  arpTimeout: {{ arp-timeout }}
  ipMTU: {{ ip-mtu }}
  learnUnsolicited: "{{ learn-unsolicited }}"
  ipAddresses:
  - ipv4Address:
      ipPrefix: {{ gateway-ip-with-cidr }}
      primary: true

---
# Template Variables:
# {{ irb-name }}: Name for IRB interface (e.g., irb-vlan47, irb-mgmt)
# {{ namespace }}: Kubernetes namespace (e.g., clab-clabmcp)
# {{ bridge-domain-name }}: Reference to bridge domain (e.g., my47bd)
# {{ router-name }}: Reference to router (e.g., ipvrf4748)
# {{ description }}: Human-readable description
# {{ arp-timeout }}: ARP timeout in seconds (default: 14400)
# {{ ip-mtu }}: IP MTU size (default: 1400) - MUST be smaller than bridge domain MTU
# {{ learn-unsolicited }}: Learn unsolicited ARP (NONE, ALL, default: NONE)
# {{ gateway-ip-with-cidr }}: Gateway IP with subnet (e.g., 192.168.47.1/24)

# Example Usage:
# irb-name: irb-vlan47
# namespace: clab-clabmcp
# bridge-domain-name: my47bd
# router-name: ipvrf4748
# description: "IRB interface for VLAN 47 client access"
# arp-timeout: 14400
# ip-mtu: 1400
# learn-unsolicited: NONE
# gateway-ip-with-cidr: 192.168.47.1/24

# Multiple IP Addresses Example:
# ipAddresses:
# - ipv4Address:
#     ipPrefix: 192.168.47.1/24
#     primary: true
# - ipv4Address:
#     ipPrefix: 192.168.47.254/24
#     primary: false
        `;
        
        return {
          contents: [{ uri, mimeType: "text/yaml", text: template }]
        };
      }

      // Troubleshooting Guide
      if (uri === "k8s://troubleshooting/evpn-connectivity") {
        const troubleshooting = `
# EVPN Connectivity Troubleshooting Guide

## Systematic Troubleshooting Approach

### Pre-Analysis: Critical Questions Pattern
Before diving into technical details, always ask these key questions:

1. **Status Analysis Questions**:
   - "Why is the resource operationalState 'down'?"
   - "What do working resources of this type have that this one doesn't?"
   - "What creates the connection between the layers (L2 ↔ L3)?"

2. **Dependency Chain Questions**:
   - "Are all upstream dependencies operational?"
   - "Do the dependencies list this resource in their status?"
   - "What working examples can I compare against?"

3. **Missing Link Questions**:
   - "What resource type creates the connection I'm expecting?"
   - "Which resource should list this resource in its status?"
   - "What's the 'smoking gun' indicator I should look for?"

### Phase 0: Immediate Pattern Recognition
\`\`\`bash
# Run this systematic check IMMEDIATELY after any resource creation
systematic_health_check() {
    local RESOURCE_TYPE=$1
    local RESOURCE_NAME=$2
    
    echo "=== IMMEDIATE POST-CREATION ANALYSIS ==="
    
    # 1. Get resource status immediately
    kubectl get $RESOURCE_TYPE $RESOURCE_NAME -o jsonpath='Operational State: {.status.operationalState}'
    echo ""
    
    # 2. Compare with working examples
    echo "Working examples of this resource type:"
    kubectl get \${RESOURCE_TYPE}s --all-namespaces -o jsonpath='{range .items[?(@.status.operationalState=="up")]}{.metadata.name} ✅{"\n"}{end}'
    
    # 3. Look for the "smoking gun" patterns
    case $RESOURCE_TYPE in
        "router")
            echo "Router smoking gun check:"
            echo "  numNodes: $(kubectl get router $RESOURCE_NAME -o jsonpath='{.status.numNodes}') (should be > 0)"
            echo "  irbInterfaces: $(kubectl get router $RESOURCE_NAME -o jsonpath='{.status.irbInterfaces}') (empty initially = OK)"
            ;;
        "irbinterface") 
            local ROUTER=$(kubectl get irbinterface $RESOURCE_NAME -o jsonpath='{.spec.router}')
            echo "IRB smoking gun check:"
            echo "  Router lists this IRB: $(kubectl get router $ROUTER -o jsonpath='{.status.irbInterfaces}' | grep -q $RESOURCE_NAME && echo '✅ YES' || echo '❌ NO')"
            echo "  IRB interfaces array: $(kubectl get irbinterface $RESOURCE_NAME -o jsonpath='{.status.interfaces}')"
            ;;
        "bridgedomain")
            echo "Bridge Domain smoking gun check:"
            echo "  numSubInterfaces: $(kubectl get bridgedomain $RESOURCE_NAME -o jsonpath='{.status.numSubInterfaces}') (>0 when VLANs attached)"
            echo "  nodes: $(kubectl get bridgedomain $RESOURCE_NAME -o jsonpath='{.status.nodes}') (should be populated)"
            ;;
    esac
}

# Usage: systematic_health_check "router" "mynewl3"
\`\`\`

### Phase 1: Infrastructure Validation

#### Step 1.1: Check Physical Interfaces
\`\`\`bash
# List all interfaces
kubectl get interfaces -n {{ namespace }}

# Check specific interface
kubectl get interface {{ interface-name }} -o yaml

# Look for:
# - operationalState: up
# - encapType: dot1q
# - speed: configured speed (e.g., 100G)
\`\`\`

**Common Issues:**
- Interface down: Check physical connectivity
- Wrong encapsulation: Must be dot1q for VLAN tagging
- Speed mismatch: Verify interface configuration

#### Step 1.2: Verify Bridge Domains
\`\`\`bash
# Check bridge domain status
kubectl get bridgedomains -n {{ namespace }}
kubectl describe bridgedomain {{ bridge-domain-name }}

# Look for:
# - operationalState: up
# - type: EVPNVXLAN (for overlay)
# - numSubInterfaces > 0 (interfaces attached)
# - nodes: fabric nodes where BD is active
\`\`\`

**Common Issues:**
- BD down: No interfaces attached or pool issues
- No nodes: Bridge domain not instantiated on fabric
- Wrong type: SIMPLE vs EVPNVXLAN mismatch

#### Step 1.3: Validate Router Status
\`\`\`bash
# Check router status
kubectl get router {{ router-name }} -o yaml

# Look for:
# - operationalState: up
# - bgp.enabled: true
# - irbInterfaces: list of attached IRBs
# - evi, vni: allocated identifiers
\`\`\`

**Common Issues:**
- Router down: BGP configuration or pool issues
- No IRB interfaces: IRBs not created or not attached
- BGP disabled: Check BGP configuration

### Phase 2: Layer 2 Connectivity Testing

#### Step 2.1: Same-VLAN Connectivity
\`\`\`bash
# Test connectivity within same VLAN first
# From client A (VLAN 47) to client B (VLAN 47)
ping {{ same-vlan-client-ip }}
\`\`\`

**If Same-VLAN Fails:**
- Check VLAN configuration
- Verify bridge interfaces are up
- Check client VLAN interface configuration

#### Step 2.2: Check Bridge Interfaces
\`\`\`bash
# Verify bridge interfaces
kubectl get bridgeinterface -n {{ namespace }}
kubectl describe bridgeinterface {{ bridge-interface-name }}

# Look for:
# - operationalState: up
# - subInterfaces: active sub-interface details
# - vlanID: correct VLAN tag
\`\`\`

#### Step 2.3: VLAN Configuration Validation
\`\`\`bash
# Check VLAN configuration
kubectl get vlan {{ vlan-name }} -o yaml

# Verify:
# - bridgeDomain reference is correct
# - interfaceSelector includes correct interfaces
# - vlanID matches bridge interface
\`\`\`

### Phase 3: Layer 3 (IRB) Connectivity Testing

#### Step 3.1: Gateway Reachability
\`\`\`bash
# Test each gateway from its local VLAN clients
ping {{ irb-gateway-ip }}  # Should work from local VLAN

# Example:
ping 192.168.47.1  # From VLAN 47 client
ping 192.168.48.1  # From VLAN 48 client
\`\`\`

**If Gateway Unreachable:**
- Check IRB interface status
- Verify IRB IP configuration
- Check client routing table

#### Step 3.2: IRB Interface Validation
\`\`\`bash
# Check IRB interface status
kubectl get irbinterface {{ irb-name }} -o yaml

# Look for:
# - operationalState: up
# - interfaces[]: list of node-specific interfaces
# - ipv4Addresses: configured gateway IPs
# - router: correct router reference
# - bridgeDomain: correct bridge domain reference
\`\`\`

#### Step 3.3: Router Integration Check
\`\`\`bash
# Verify IRB is attached to router
kubectl get router {{ router-name }} -o yaml | grep -A 10 irbInterfaces

# Should show IRB in list:
# irbInterfaces:
# - irb-vlan47
# - irb-vlan48
\`\`\`

### Phase 4: Inter-VLAN Routing Testing

#### Step 4.1: Basic Inter-VLAN Ping
\`\`\`bash
# Test inter-VLAN connectivity
ping {{ remote-vlan-client-ip }}

# Example: From VLAN 47 client to VLAN 48 client
ping 192.168.48.30
\`\`\`

#### Step 4.2: Analyze Ping Results
**Successful Ping Indicators:**
- TTL decremented (usually 253, indicating 2 hops)
- Low latency (< 5ms for local fabric)
- 0% packet loss

**Failed Ping Analysis:**
- Destination Host Unreachable: Routing issue
- No response: Check remote client configuration
- High latency: Network congestion or sub-optimal routing

#### Step 4.3: Client Routing Verification
\`\`\`bash
# Check client routing table
ip route show

# Should show routes like:
# 192.168.48.0/24 via 192.168.47.1 dev eth1.47  # Route to other VLAN
# 192.168.47.0/24 dev eth1.47  # Local VLAN subnet
\`\`\`

### Phase 5: EVPN Route Advertisement

#### Step 5.1: BGP Status Check
\`\`\`bash
# Check BGP configuration on router
kubectl get router {{ router-name }} -o yaml | grep -A 20 bgp

# Verify:
# - enabled: true
# - autonomousSystem: unique AS number
# - ipv4Unicast.enabled: true
\`\`\`

#### Step 5.2: Route Target Verification
\`\`\`bash
# Check route targets
kubectl get router {{ router-name }} -o yaml | grep -A 5 Target
kubectl get bridgedomain {{ bridge-domain-name }} -o yaml | grep -A 5 Target

# Should show:
# exportTarget: target:1:xxx
# importTarget: target:1:xxx
\`\`\`

### Phase 6: Advanced Diagnostics

#### Step 6.1: Fabric Node Health
\`\`\`bash
# Check fabric status
kubectl get fabric -n {{ namespace }} -o yaml

# Look for:
# - health: 100 (or close to 100)
# - operationalState: up
# - nodes: all expected fabric nodes listed
\`\`\`

#### Step 6.2: Pool Resource Availability
\`\`\`bash
# Check pool usage
kubectl get evipools vni-pools tunnel-index-pools -o yaml

# Verify pools have available capacity
\`\`\`

#### Step 6.3: Controller Logs
\`\`\`bash
# Check EDA controller logs
kubectl logs -n {{ eda-controller-namespace }} {{ controller-pod-name }}

# Look for:
# - Resource creation/update events
# - BGP route advertisement logs
# - Error messages or warnings
\`\`\`

## Common Issue Resolution

### Issue: Router Operational but No L3 Connectivity (The Missing IRB Link)

**The Classic Pattern - Router Down with Empty IRB Array:**
\`\`\`yaml
# Router appears operational but isn't working for L3
status:
  operationalState: "down"     # ❌ Despite being created successfully
  numNodes: 0                  # ❌ Not deployed on any nodes  
  irbInterfaces: []            # ❌ SMOKING GUN: Empty IRB array
\`\`\`

**Compare with Working Router:**
\`\`\`yaml
# Working router pattern
status:
  operationalState: "up"       # ✅ Operational
  numNodes: 2                  # ✅ Deployed on fabric nodes
  irbInterfaces: ["irb-vlan100", "irb-vlan300"]  # ✅ Has IRB connections
\`\`\`

**The Missing Link Discovery Process:**
\`\`\`bash
# 1. Immediate realization check
echo "=== THE MISSING LINK ANALYSIS ==="
echo "Router IRB interfaces: $(kubectl get router <router-name> -o jsonpath='{.status.irbInterfaces}')"
echo "Expected: Should list IRB interface names"
echo "Actual: Empty array [] means no L2-L3 connections"

# 2. Check if IRB interfaces exist
echo ""
echo "Available IRB interfaces that could connect:"
kubectl get irbinterfaces --all-namespaces -o custom-columns=NAME:.metadata.name,ROUTER:.spec.router,BRIDGE_DOMAIN:.spec.bridgeDomain

# 3. The realization: Need to create IRB interface
echo ""
echo "🔍 INSIGHT: Router needs IRB Interface to connect to Bridge Domain"
echo "IRB Interface creates the L2 ↔ L3 connection"
\`\`\`

**Resolution Pattern:**
1. **Create the missing IRB Interface** that connects:
   - \`spec.router\`: References the router
   - \`spec.bridgeDomain\`: References the bridge domain  
   - \`spec.ipAddresses\`: Provides L3 gateway functionality

2. **Verify the connection is established:**
\`\`\`bash
# After creating IRB interface
kubectl get router <router-name> -o jsonpath='{.status.irbInterfaces}'
# Should now show: ["<irb-interface-name>"]
\`\`\`

### Issue: "Destination Host Unreachable"

**Diagnosis Steps:**
1. **Check IRB Interface exists first**: \`kubectl get irbinterfaces | grep <bridge-domain>\`
2. Verify local gateway reachability: \`ping {{ local-gateway-ip }}\`
3. Check IRB interface operational status
4. Verify routing table has route to destination VLAN
5. Check remote client configuration

**Resolution:**
- **Primary**: Create missing IRB interface if L2-L3 connection doesn't exist
- Add missing static routes on clients  
- Fix IRB interface configuration
- Verify bridge domain connectivity

### Issue: Bridge Domain Stuck in Down State

**Diagnosis Steps:**
1. Check attached interfaces: \`kubectl get bridgeinterface\`
2. Verify physical interface status
3. Check VLAN configuration

**Resolution:**
- Create bridge interfaces to attach physical interfaces
- Fix interface encapsulation (must be dot1q)
- Verify VLAN and bridge interface VLAN ID match

### Issue: IRB Interface Creation Fails

**Diagnosis Steps:**
1. Verify router exists and is operational
2. Check bridge domain exists and is operational
3. Verify namespace consistency

**Resolution:**
- Create missing dependencies first
- Fix resource references (names, namespaces)
- Check RBAC permissions

### Issue: High Latency Inter-VLAN Communication

**Diagnosis:**
- Check fabric health and node connectivity
- Verify optimal path selection
- Monitor controller performance

**Resolution:**
- Investigate fabric network issues
- Check BGP path selection
- Consider MTU optimization

### Issue: Large Packet Loss or Fragmentation

**Diagnosis Steps:**
1. Test with large packets: \`ping -s 1450 <destination>\`
2. Check IRB interface MTU: \`kubectl get irbinterface <irb-name> -o yaml | grep ipMTU\`
3. Check bridge domain MTU configuration
4. Monitor for fragmentation in traffic flows

**Resolution:**
- Reduce IRB IP MTU to be 20-50 bytes smaller than bridge domain MTU
- Update IRB configuration: \`kubectl patch irbinterface <irb-name> --type='merge' -p='{"spec":{"ipMTU":<new-value>}}'\`
- Verify end-to-end MTU path consistency
- Test with varying packet sizes to find optimal MTU

## Prevention Best Practices

1. **Create in correct order**: Interface → BD → VLAN/Bridge Interface → Router → IRB
2. **Verify each step**: Check status before proceeding to dependent resources
3. **Use consistent naming**: Include VLAN ID, node location in names
4. **Monitor pools**: Ensure adequate EVI/VNI pool capacity
5. **Test incrementally**: Verify L2 before implementing L3
6. **Document configuration**: Keep track of IP assignments and VLAN mappings

## Key Systematic Analysis Patterns 

### The "Smoking Gun" Indicators to Always Check:

1. **Router Issues**:
   - ✅ **Working**: \`operationalState: "up"\`, \`numNodes > 0\`, \`irbInterfaces: ["irb-name"]\`
   - ❌ **Broken**: \`operationalState: "down"\`, \`numNodes: 0\`, \`irbInterfaces: []\`

2. **IRB Interface Issues**:
   - ✅ **Working**: Router's \`status.irbInterfaces\` contains this IRB name
   - ❌ **Broken**: Router doesn't list this IRB in its status

3. **Bridge Domain Issues**:
   - ✅ **Working**: \`numSubInterfaces > 0\` (has attached interfaces)
   - ❌ **Broken**: \`numSubInterfaces: 0\` (no VLANs/interfaces attached)

### Critical Questions That Reveal Root Cause:

1. **"Why is operationalState down?"** → Look at dependency status
2. **"What do working examples have that this doesn't?"** → Compare status fields
3. **"What creates the L2-L3 connection?"** → IRB Interface resource
4. **"Does the parent resource list this child?"** → Cross-reference validation

### Immediate Post-Creation Workflow:

\`\`\`bash
# Never declare success without running this pattern:
# 1. kubectl get <resource-type> <name> -o jsonpath='{.status.operationalState}'
# 2. Compare with working examples of same resource type  
# 3. Look for "smoking gun" indicators specific to resource type
# 4. Cross-reference: Does parent resource list this child resource?
# 5. If broken, ask: "What creates the missing connection?"
\`\`\`

### Resource Relationship Memory Map:

\`\`\`
Router ←→ IRBInterface ←→ BridgeDomain ←→ VLAN ←→ Interface
  ↑           ↑              ↑           ↑         ↑
Lists IRBs  Connects     Lists VLANs   Uses     Physical
in status   L2 to L3     in status     Interface    Port
\`\`\`

**The Golden Rule**: Always validate the complete dependency chain, not just individual resources.

This systematic approach helps isolate issues at each layer and provides a clear path to resolution.
        `;
        
        return {
          contents: [{ uri, mimeType: "text/markdown", text: troubleshooting }]
        };
      }
      
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Resource not found: ${uri}`
      );
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read resource: ${error}`
      );
    }
  },
});
