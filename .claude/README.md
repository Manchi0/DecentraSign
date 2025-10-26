# Claude Code Configuration

This directory contains configuration and MCP servers for Claude Code.

## MCP Servers

### Sui Documentation Server

Located in `.claude/mcp-servers/sui-docs-server/`

This MCP server provides access to Sui and Move blockchain documentation:
- Sui Documentation - https://docs.sui.io
- Move Book - https://move-book.com
- Seal Documentation - https://seal-docs.wal.app
- Wal Documentation - https://docs.wal.app
- Enoki Documentation - https://enoki.mystenlabs.com
- dApp Kit SDK - https://sdk.mystenlabs.com/dapp-kit

#### Installation

```bash
cd .claude/mcp-servers/sui-docs-server
npm install
```

#### Configuration

The server is configured in `.claude/mcp.json` and will be automatically loaded by Claude Code.

#### Testing

To test the server manually:
```bash
cd .claude/mcp-servers/sui-docs-server
node index.js
```

The server will run in stdio mode and wait for MCP protocol messages.

## Configuration Files

- `mcp.json` - MCP server configuration for Claude Code
