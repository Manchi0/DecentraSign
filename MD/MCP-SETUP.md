# MCP Server Setup - Quick Start

## ✅ Setup Complete!

Your Sui Documentation MCP server has been set up and configured. Here's what's ready:

### Files Created

1. **MCP Server** (`mcp-server/`)
   - ✅ TypeScript source files
   - ✅ Dependencies installed
   - ✅ Built and ready to run

2. **Configuration** (`.claude/mcp.json`)
   - ✅ Server registered with Claude
   - ✅ Correct path configured

3. **Documentation** (`CLAUDE.md`)
   - ✅ Complete usage guide
   - ✅ Example queries
   - ✅ Troubleshooting tips

## Next Steps

### 1. Index Documentation (Required - First Time Only)

```bash
cd mcp-server
npm run index
```

This will download and index ~300 pages from:
- Sui Documentation
- Move Book
- Seal Documentation
- Walrus Documentation
- Enoki Documentation
- dApp Kit SDK

**Expected time**: 5-10 minutes
**You only need to do this once** (or when you want to update the docs)

### 2. Restart Claude Code

After indexing completes, restart Claude Code to activate the MCP server.

### 3. Test It!

Ask Claude:
```
"Search sui docs for 'how to create a smart contract'"
"Explain Move struct syntax"
"How do I implement zkLogin with Enoki?"
```

## Usage

Once set up, you can ask Claude questions about:

- **Sui blockchain**: Object model, transactions, Move integration
- **Move language**: Syntax, modules, structs, capabilities
- **Seal**: Smart contract features and deployment
- **Walrus**: Blob storage and data management
- **Enoki**: zkLogin and sponsored transactions
- **dApp Kit**: React hooks, wallet integration, SDK usage

## Example Queries

```
"How do I transfer Sui objects?"
"Show me Move function syntax"
"What's the Seal contract structure?"
"How to store data on Walrus?"
"Set up zkLogin authentication"
"Connect wallet with dApp Kit React hooks"
```

## Server Status

Check if the server is working:

```bash
# View indexed documentation stats
cd mcp-server
node -e "const db = require('./dist/database.js'); const d = new db.DocDatabase(); console.log(d.getStats());"
```

## Troubleshooting

### Server Not Working?

1. **Check build**:
   ```bash
   cd mcp-server
   npm run build
   ```

2. **Verify indexing**:
   ```bash
   ls mcp-server/data/docs.json
   ```

3. **Re-index if needed**:
   ```bash
   cd mcp-server
   npm run index
   ```

4. **Restart Claude Code**

### Search Returns Nothing?

Make sure you've run `npm run index` first!

## File Locations

- **MCP Server**: `mcp-server/`
- **Configuration**: `.claude/mcp.json`
- **Documentation**: `CLAUDE.md`
- **Database**: `mcp-server/data/docs.json`
- **Server README**: `mcp-server/README.md`

## Updating Documentation

To get the latest documentation:

```bash
cd mcp-server
rm data/docs.json  # Clear old data
npm run index      # Re-index
```

## Architecture

```
┌──────────────┐
│ Claude Code  │  ← You ask questions
└──────┬───────┘
       │ MCP Protocol
┌──────▼───────┐
│  MCP Server  │  ← Searches documentation
└──────┬───────┘
       │
┌──────▼───────┐
│ docs.json    │  ← 300+ indexed pages
│ (JSON DB)    │
└──────────────┘
```

## Support

- **Full Guide**: See `CLAUDE.md`
- **Server Details**: See `mcp-server/README.md`
- **Issues**: Check indexing logs and rebuild if needed

---

**Ready to use!** Just run `npm run index` in the `mcp-server` directory, restart Claude, and start asking questions about Sui development!
