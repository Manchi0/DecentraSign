# Sui Documentation MCP Server Guide

This project includes a local MCP (Model Context Protocol) server that provides Claude with instant access to comprehensive Sui blockchain, Move, Seal, Walrus, Enoki, and dApp Kit documentation.

## What is the MCP Server?

The MCP server is a local service that:
- **Indexes** documentation from multiple Sui ecosystem sources
- **Searches** through documentation using full-text search
- **Provides** relevant code examples and API references instantly
- **Works offline** after initial indexing

## Quick Start

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Index Documentation

This step fetches and indexes all documentation (takes 5-10 minutes):

```bash
npm run index
```

You'll see output like:
```
🚀 Starting documentation indexing...

🔍 Indexing Sui Documentation...
  ✓ Indexed (1/50): Getting Started
  ✓ Indexed (2/50): Install Sui
  ...
✅ Finished indexing Sui Documentation: 50 pages

📊 Indexing complete!
   Total sources: 6
   Total pages: 300
```

### 3. Build the Server

```bash
npm run build
```

### 4. Restart Claude

The server is already configured in `.claude/mcp.json`. Simply restart Claude Code to activate it.

## Using the Documentation Server

Once configured, you can ask Claude questions about Sui development:

### Example Queries

**Basic Sui Concepts:**
```
"How do I create a new Sui smart contract?"
"Explain Sui's object model"
"What are Sui Move modules?"
```

**Move Programming:**
```
"Show me Move struct syntax"
"How do I define a function in Move?"
"Explain Move's ownership system"
```

**Seal Smart Contracts:**
```
"How do I deploy a Seal contract?"
"What are Seal's key features?"
```

**Walrus Integration:**
```
"How do I store data on Walrus?"
"What is Walrus blob storage?"
```

**Enoki (zkLogin & Sponsored Transactions):**
```
"How do I implement zkLogin?"
"Set up sponsored transactions with Enoki"
```

**dApp Kit SDK:**
```
"How do I connect a wallet using dApp Kit?"
"Show me a React example with dApp Kit"
```

## Available Tools

Claude has access to three powerful tools through the MCP server:

### 1. `search_sui_docs`

Search across all documentation sources:

```
Parameters:
  - query (required): Search terms
  - source (optional): Filter by specific source
    (sui-docs, move-book, seal-docs, wal-docs, enoki-docs, dapp-kit)
  - limit (optional): Max results (default: 5)

Example: "Search sui docs for 'object ownership transfer'"
```

### 2. `get_doc_page`

Retrieve full content of a specific documentation page:

```
Parameters:
  - url (required): Full URL of the page

Example: "Get the doc page at https://docs.sui.io/guides/developer/first-app"
```

### 3. `list_doc_sources`

List all available documentation sources with descriptions.

## Documentation Sources

The server indexes the following sources:

| Source | Description | Pages |
|--------|-------------|-------|
| **Sui Docs** | Official Sui blockchain documentation | ~50 |
| **Move Book** | The Move programming language book | ~50 |
| **Seal Docs** | Seal smart contract documentation | ~50 |
| **Wal Docs** | Wal/Walrus platform documentation | ~50 |
| **Enoki Docs** | Enoki zkLogin and sponsored transactions | ~50 |
| **dApp Kit** | Sui dApp Kit SDK documentation | ~50 |

## Advanced Usage

### Re-indexing Documentation

To update the documentation index (recommended weekly):

```bash
cd mcp-server
npm run index
```

### Searching Specific Sources

You can filter searches to specific documentation sources:

```
"Search move-book for 'generic types'"
"Search enoki-docs for 'zklogin setup'"
"Search dapp-kit for 'useWalletKit hook'"
```

### Database Location

The documentation database is stored at:
```
mcp-server/data/docs.db
```

You can delete this file to force a full re-index.

## Troubleshooting

### Server Not Responding

1. Check that the server is built:
   ```bash
   cd mcp-server
   npm run build
   ```

2. Verify the database exists:
   ```bash
   ls mcp-server/data/docs.db
   ```

3. Try re-indexing:
   ```bash
   npm run index
   ```

### No Search Results

If searches return no results:

1. Ensure indexing completed successfully
2. Check database stats:
   ```bash
   sqlite3 mcp-server/data/docs.db "SELECT COUNT(*) FROM pages;"
   ```

3. Try re-indexing specific problematic sources

### Performance Issues

If searches are slow:

1. The database uses FTS5 (full-text search) for optimal performance
2. Limit results using the `limit` parameter
3. Be more specific in search queries

## Configuration

### Custom Documentation Sources

To add more documentation sources, edit:
```
mcp-server/src/indexer.ts
```

Add your source to `DOC_SOURCES`:

```typescript
"my-docs": {
  url: "https://docs.example.com",
  name: "My Documentation",
  description: "My custom docs",
  sitemap: null
}
```

Then re-run: `npm run index`

### Changing Indexed Page Limit

In `indexer.ts`, modify the `maxPages` parameter:

```typescript
await this.indexSource(sourceId, source, 100); // Index up to 100 pages
```

## Architecture

```
┌─────────────────┐
│  Claude Code    │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│   MCP Server    │
│  (Node.js/TS)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  SQLite + FTS5  │
│   (300 pages)   │
└─────────────────┘
```

## Benefits

✅ **Fast**: Local database with full-text search
✅ **Offline**: Works without internet after indexing
✅ **Comprehensive**: 6 documentation sources, 300+ pages
✅ **Up-to-date**: Easy to re-index when docs change
✅ **Accurate**: Direct quotes from official documentation

## Support

For issues or questions about the MCP server:

1. Check this guide first
2. Review the MCP server README: `mcp-server/README.md`
3. Check the indexing logs for errors
4. Verify database integrity

---

**Pro Tip**: Always ask Claude to cite sources when using documentation. The MCP server provides URLs for all retrieved content!
