#!/usr/bin/env node

/**
 * MCP Server for Sui/Move Documentation
 * Provides access to official Sui and Move documentation sources
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const DOC_SOURCES = {
  "sui-docs": {
    url: "https://docs.sui.io",
    name: "Sui Documentation",
    description: "Official Sui blockchain documentation"
  },
  "move-book": {
    url: "https://move-book.com",
    name: "Move Book",
    description: "The Move programming language book"
  },
  "seal-docs": {
    url: "https://seal-docs.wal.app",
    name: "Seal Documentation",
    description: "Seal smart contract documentation"
  },
  "wal-docs": {
    url: "https://docs.wal.app",
    name: "Wal Documentation",
    description: "Wal platform documentation"
  },
  "enoki-docs": {
    url: "https://enoki.mystenlabs.com",
    name: "Enoki Documentation",
    description: "Enoki zkLogin and sponsored transactions"
  },
  "dapp-kit": {
    url: "https://sdk.mystenlabs.com/dapp-kit",
    name: "dApp Kit SDK",
    description: "Sui dApp Kit SDK documentation"
  }
};

class SuiDocsServer {
  constructor() {
    this.server = new Server(
      {
        name: "sui-docs-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_sui_docs",
          description: "Search across all Sui and Move documentation sources. Use this to find information about Sui blockchain, Move language, smart contracts, dApp development, and related topics.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query or topic to look up in the documentation"
              },
              source: {
                type: "string",
                enum: Object.keys(DOC_SOURCES),
                description: "Specific documentation source to search (optional). Options: sui-docs, move-book, seal-docs, wal-docs, enoki-docs, dapp-kit"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "fetch_doc_page",
          description: "Fetch a specific documentation page by URL path. Use this when you know the exact page you want to retrieve.",
          inputSchema: {
            type: "object",
            properties: {
              source: {
                type: "string",
                enum: Object.keys(DOC_SOURCES),
                description: "Documentation source"
              },
              path: {
                type: "string",
                description: "URL path to the specific page (e.g., '/guides/developer/getting-started')"
              }
            },
            required: ["source", "path"]
          }
        },
        {
          name: "list_doc_sources",
          description: "List all available Sui and Move documentation sources with their descriptions.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_doc_sources":
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(DOC_SOURCES, null, 2)
                }
              ]
            };

          case "fetch_doc_page":
            return await this.fetchDocPage(args.source, args.path);

          case "search_sui_docs":
            return await this.searchDocs(args.query, args.source);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async fetchDocPage(source, path) {
    if (!DOC_SOURCES[source]) {
      throw new Error(`Unknown source: ${source}`);
    }

    const url = `${DOC_SOURCES[source].url}${path}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove script tags, style tags, and navigation elements
      $('script, style, nav, header, footer, .nav, .sidebar').remove();

      // Extract main content
      const mainContent = $('main, article, .content, .markdown-body').first();
      const text = mainContent.length > 0
        ? mainContent.text().trim()
        : $('body').text().trim();

      // Clean up whitespace
      const cleanedText = text.replace(/\s+/g, ' ').trim();

      return {
        content: [
          {
            type: "text",
            text: `# ${DOC_SOURCES[source].name}\n## ${url}\n\n${cleanedText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  async searchDocs(query, specificSource = null) {
    const sources = specificSource
      ? [specificSource]
      : Object.keys(DOC_SOURCES);

    const results = [];

    for (const source of sources) {
      try {
        // For a basic implementation, we'll fetch the home page and search
        // In a production setup, you'd want to use the site's search API or index
        const docInfo = DOC_SOURCES[source];
        const response = await fetch(docInfo.url);

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          // Simple keyword search in page content
          const text = $('body').text().toLowerCase();
          const queryLower = query.toLowerCase();

          if (text.includes(queryLower)) {
            results.push({
              source: source,
              name: docInfo.name,
              url: docInfo.url,
              description: docInfo.description,
              relevance: "Found matching content"
            });
          }
        }
      } catch (error) {
        console.error(`Error searching ${source}:`, error.message);
      }
    }

    const resultText = results.length > 0
      ? `Found ${results.length} documentation source(s) with relevant content:\n\n${JSON.stringify(results, null, 2)}\n\nTo fetch specific pages, use the fetch_doc_page tool with appropriate source and path.`
      : `No direct matches found for "${query}". Try:\n- Using more general search terms\n- Checking specific sources with fetch_doc_page\n- Using list_doc_sources to see all available documentation`;

    return {
      content: [
        {
          type: "text",
          text: resultText
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Sui Docs MCP server running on stdio");
  }
}

const server = new SuiDocsServer();
server.run().catch(console.error);
