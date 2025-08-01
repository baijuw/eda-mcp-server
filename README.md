# EDA MCP Server Kubernetes

EDA MCP Server forked from [mcp-server-kubernetes](https://github.com/Flux159/mcp-server-kubernetes.git) that can connect to a Kubernetes cluster and manage it. Supports loading kubeconfig from multiple sources in priority order.


## Docker Build

### Standard Build
```bash
docker build . -t eda-mcp-server
```

### Build with Proxy (if behind corporate proxy)
```bash
docker build . --build-arg HTTP_PROXY=<proxy server> --build-arg HTTPS_PROXY=<proxy server> --build-arg NO_PROXY=<subnets to skip> -t eda-mcp-server
```

## Docker Run

Run the EDA MCP server in a container:

```bash
docker  run --rm -it -p 3001:3001 -e SPAWN_MAX_BUFFER=10485760 -e ENABLE_UNSAFE_SSE_TRANSPORT=1  -e PORT=3001  -e HOST=0.0.0.0 -v ~/.kube/config:/home/appuser/.kube/config eda-mcp-server
```

**Port 3001** is used because the MCP server inside the container listens on port 3001.

**SPAWN_MAX_BUFFER** is set to 10MB (10485760 bytes) as the client often needs to read all CRDs to understand certain Kubernetes interactions, requiring a larger buffer than the default.

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["mcp-server-kubernetes"]
    }
  }
}
```

By default, the server loads kubeconfig from `~/.kube/config`. For additional authentication options (environment variables, custom paths, etc.), see [ADVANCED_README.md](ADVANCED_README.md).

The server will automatically connect to your current kubectl context. Make sure you have:

1. kubectl installed and in your PATH
2. A valid kubeconfig file with contexts configured
3. Access to a Kubernetes cluster configured for kubectl (e.g. minikube, Rancher Desktop, GKE, etc.)
4. Helm v3 installed and in your PATH (no Tiller required). Optional if you don't plan to use Helm.

You can verify your connection by asking Claude to list your pods or create a test deployment.

If you have errors open up a standard terminal and run `kubectl get pods` to see if you can connect to your cluster without credentials issues.

## Usage with mcp-chat

[mcp-chat](https://github.com/Flux159/mcp-chat) is a CLI chat client for MCP servers. You can use it to interact with the Kubernetes server.

```shell
npx mcp-chat --server "npx mcp-server-kubernetes"
```

Alternatively, pass it your existing Claude Desktop configuration file from above (Linux should pass the correct path to config):

Mac:

```shell
npx mcp-chat --config "~/Library/Application Support/Claude/claude_desktop_config.json"
```

Windows:

```shell
npx mcp-chat --config "%APPDATA%\Claude\claude_desktop_config.json"
```

## Features

- [x] Connect to a Kubernetes cluster
- [x] Unified kubectl API for managing resources
  - Get or list resources with `kubectl_get`
  - Describe resources with `kubectl_describe`
  - List resources with `kubectl_get`
  - Create resources with `kubectl_create`
  - Apply YAML manifests with `kubectl_apply`
  - Delete resources with `kubectl_delete`
  - Get logs with `kubectl_logs`
  - Manage kubectl contexts with `kubectl_context`
  - Explain Kubernetes resources with `explain_resource`
  - List API resources with `list_api_resources`
  - Scale resources with `kubectl_scale`
  - Update field(s) of a resource with `kubectl_patch`
  - Manage deployment rollouts with `kubectl_rollout`
  - Execute any kubectl command with `kubectl_generic`
  - Verify connection with `ping`
- [x] Advanced operations
  - Scale deployments with `kubectl_scale` (replaces legacy `scale_deployment`)
  - Port forward to pods and services with `port_forward`
  - Run Helm operations
    - Install, upgrade, and uninstall charts
    - Support for custom values, repositories, and versions
- [x] Workflow resource tool (`workflow-resource`) for complex multi-step operations
- [x] Troubleshooting Prompt (`k8s-diagnose`)
  - Guides through a systematic Kubernetes troubleshooting flow for pods based on a keyword and optional namespace.
- [x] Non-destructive mode for read and create/update-only access to clusters

## Prompts

The MCP Kubernetes server includes specialized prompts to assist with common diagnostic operations.

### k8s-diagnose Prompt

This prompt provides a systematic troubleshooting flow for Kubernetes pods. It accepts a `keyword` to identify relevant pods and an optional `namespace` to narrow the search.
The prompt's output will guide you through an autonomous troubleshooting flow, providing instructions for identifying issues, collecting evidence, and suggesting remediation steps.

## Local Development

Make sure that you have [bun installed](https://bun.sh/docs/installation). Clone the repo & install dependencies:

```bash
git clone https://github.com/Flux159/mcp-server-kubernetes.git
cd mcp-server-kubernetes
bun install
```

### Development Workflow

1. Start the server in development mode (watches for file changes):

```bash
bun run dev
```

2. Run unit tests:

```bash
bun run test
```

3. Build the project:

```bash
bun run build
```

4. Local Testing with [Inspector](https://github.com/modelcontextprotocol/inspector)

```bash
npx @modelcontextprotocol/inspector node dist/index.js
# Follow further instructions on terminal for Inspector link
```

5. Local testing with Claude Desktop

```json
{
  "mcpServers": {
    "mcp-server-kubernetes": {
      "command": "node",
      "args": ["/path/to/your/mcp-server-kubernetes/dist/index.js"]
    }
  }
}
```

6. Local testing with [mcp-chat](https://github.com/Flux159/mcp-chat)

```bash
bun run chat
```

## Advanced

### Non-Destructive Mode

You can run the server in a non-destructive mode that disables all destructive operations (delete pods, delete deployments, delete namespaces, etc.):

```shell
ALLOW_ONLY_NON_DESTRUCTIVE_TOOLS=true npx mcp-server-kubernetes
```

For Claude Desktop configuration with non-destructive mode:

```json
{
  "mcpServers": {
    "kubernetes-readonly": {
      "command": "npx",
      "args": ["mcp-server-kubernetes"],
      "env": {
        "ALLOW_ONLY_NON_DESTRUCTIVE_TOOLS": "true"
      }
    }
  }
}
```

### Commands Available in Non-Destructive Mode

All read-only and resource creation/update operations remain available:

- Resource Information: `kubectl_get`, `kubectl_describe`, `kubectl_logs`, `explain_resource`, `list_api_resources`
- Resource Creation/Modification: `kubectl_apply`, `kubectl_create`, `kubectl_scale`, `kubectl_patch`, `kubectl_rollout`
- Helm Operations: `install_helm_chart`, `upgrade_helm_chart`
- Connectivity: `port_forward`, `stop_port_forward`
- Context Management: `kubectl_context`

### Commands Disabled in Non-Destructive Mode

The following destructive operations are disabled:

- `kubectl_delete`: Deleting any Kubernetes resources
- `uninstall_helm_chart`: Uninstalling Helm charts
- `cleanup`: Cleanup of managed resources
- `kubectl_generic`: General kubectl command access (may include destructive operations)

For additional advanced features, see the [ADVANCED_README.md](ADVANCED_README.md).

## Architecture

See this [DeepWiki link](https://deepwiki.com/Flux159/mcp-server-kubernetes) for a more indepth architecture overview created by Devin.

This section describes the high-level architecture of the MCP Kubernetes server.

### Request Flow

The sequence diagram below illustrates how requests flow through the system:

```mermaid
sequenceDiagram
    participant Client
    participant Transport as Transport Layer
    participant Server as MCP Server
    participant Filter as Tool Filter
    participant Handler as Request Handler
    participant K8sManager as KubernetesManager
    participant K8s as Kubernetes API
    Note over Transport: StdioTransport or<br>SSE Transport
    Note over Client: Client acts as proxy between<br>AI models (Claude, GPT, etc.) and MCP Server
    
    %% Connection and tool advertisement phase
    Client->>Transport: Establish connection
    Transport->>Server: Open stream
    Server-->>Client: Advertise available tools
    Note over Server,Client: Tool list includes schemas,<br>descriptions, operation types
    
    %% Initialization phase - Context enrichment
    Note over Client,Server: Initialization: Context Enrichment
    Client->>Transport: Request CRD discovery
    Transport->>Server: Forward CRD request
    Server->>Handler: Route to CRD handler
    Handler->>K8sManager: Get all CRDs
    K8sManager->>K8s: Query CRDs API
    K8s-->>K8sManager: Return CRD definitions
    K8sManager-->>Handler: Format CRD data
    Handler-->>Server: Return CRD list
    Server-->>Client: CRD schemas and definitions

    Client->>Transport: Request workflow-resource tool
    Transport->>Server: Forward workflow-resource request
    Server->>Handler: Route to workflow-resource handler
    Handler->>K8sManager: Get EDA custom resources
    K8sManager->>K8s: Query custom resources
    K8s-->>K8sManager: Return custom resource data
    K8sManager-->>Handler: Format resource data
    Handler-->>Server: Return resource inventory
    Server-->>Client: Available EDA resources

    Note over Client: Context now enriched with<br>CRDs and EDA resources
    
    %% Operational phase
    Note over Client,Server: Operational phase - Direct EDA operations
    Client->>Transport: Send Request
    Transport->>Server: Forward Request
    alt Tools Request
        Server->>Filter: Filter available tools
        Note over Filter: Remove destructive tools<br>if in non-destructive mode
        Filter->>Handler: Route to tools handler
        alt kubectl operations
            Handler->>K8sManager: Execute kubectl operation
            K8sManager->>K8s: Make API call
        else Helm operations
            Handler->>K8sManager: Execute Helm operation
            K8sManager->>K8s: Make API call
        else Port Forward operations
            Handler->>K8sManager: Set up port forwarding
            K8sManager->>K8s: Make API call
        else EDA Custom Resource operations
            Handler->>K8sManager: Execute EDA CR operation
            K8sManager->>K8s: Make Custom Resource API call
        end
        K8s-->>K8sManager: Return result
        K8sManager-->>Handler: Process response
        Handler-->>Server: Return tool result
    else Resource Request
        Server->>Handler: Route to resource handler
        Handler->>K8sManager: Get resource data
        K8sManager->>K8s: Query API
        K8s-->>K8sManager: Return data
        K8sManager-->>Handler: Format response
        Handler-->>Server: Return resource data
    end
```

See this [DeepWiki link](https://deepwiki.com/Flux159/mcp-server-kubernetes) for a more indepth architecture overview created by Devin.

## Publishing new release





