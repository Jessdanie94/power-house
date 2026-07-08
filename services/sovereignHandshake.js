/**
 * sovereignHandshake.js — JDV Sovereign Handshake
 * Elite Master-Controller for Platform Credential Orchestration
 * 
 * Bridges Shopify Admin (shpat_) and Sellvia API credentials
 * through a zero-leak security envelope with vector-powered product sync.
 * 
 * Level 4 Engineering — Jesse Daniels Ventures, July 2026
 */

import { createRequire } from 'module';
import logger from '../secureLogger.js';

const require = createRequire(import.meta.url);
const { shopifyRest, shopifyGraphQL, listProductsRest } = require('../shopifySafeClient.js');
const { searchSimilarProducts } = require('./vectorSearchNode.js');
const mongoose = require('mongoose');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────

const HANDSHAKE_VERSION = '1.2.0';
const SELLVIA_BASE_URL = 'https://sellvia.com/api/v1';

const REQUIRED_KEYS = [
  'SHOPIFY_ADMIN_ACCESS_TOKEN',
  'SHOPIFY_STORE_DOMAIN',
  'SHOPIFY_API_VERSION',
  'SELLVIA_API_KEY',
];

// ─── VECTOR INDEX CONFIGURATION ─────────────────────────────────────────────────

const VECTOR_INDEX_NAME = 'vector_index';
const VECTOR_COLLECTION = 'vendorinventories';

/**
 * numDimensions — MUST be a strict Integer (Int), never a string.
 */
const NUM_DIMENSIONS = 1536; 

/**
 * HNSW Options — Enterprise-Compliant
 * maxEdges: 64 (Official max)
 * numEdgeCandidates: 3200 (Official max)
 * Similarity: dotProduct (Recommended for normalized vectors)
 */
const HNSW_MAX_EDGES = 64; 
const HNSW_NUM_EDGE_CANDIDATES = 3200; 
const SIMILARITY_METRIC = 'dotProduct';

/**
 * Full index definition — Filter-First Structure
 * Field Order: Index 0 = filter, Index 1 = vector
 */
const INDEX_DEFINITION = {
  fields: [
    {
      type: 'filter',
      path: 'vendors.vendorName'
    },
    {
      type: 'vector',
      path: 'embedding',
      numDimensions: NUM_DIMENSIONS,
      similarity: SIMILARITY_METRIC,
      quantization: 'none',
      indexingMethod: 'hnsw',
      hnswOptions: {
        maxEdges: HNSW_MAX_EDGES,
        numEdgeCandidates: HNSW_NUM_EDGE_CANDIDATES
      }
    }
  ]
};

// ─── INDEX LIFECYCLE ────────────────────────────────────────────────────────────

async function deleteIndex() {
  const collection = mongoose.connection.collection(VECTOR_COLLECTION);
  logger.info(`[SovereignHandshake] Deleting index '${VECTOR_INDEX_NAME}'...`);
  try {
    const cursor = collection.listSearchIndexes();
    let indexExists = false;
    for await (const index of cursor) {
      if (index.name === VECTOR_INDEX_NAME) {
        indexExists = true;
        break;
      }
    }
    if (!indexExists) return false;
    await collection.dropSearchIndex(VECTOR_INDEX_NAME);
    return true;
  } catch (err) {
    logger.error('[SovereignHandshake] Deletion failed', err);
    throw err;
  }
}

async function createIndex() {
  const collection = mongoose.connection.collection(VECTOR_COLLECTION);
  logger.info(`[SovereignHandshake] Creating '${VECTOR_INDEX_NAME}' (Filter-First, dotProduct)...`);
  try {
    await collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: 'vectorSearch',
      definition: INDEX_DEFINITION
    });
    return true;
  } catch (err) {
    logger.error('[SovereignHandshake] Creation failed', err);
    throw err;
  }
}

export async function recreateIndex(options = {}) {
  const { waitAfterDeleteMs = 5000 } = options;
  logger.info('[SovereignHandshake] ═══ INDEX REFRESH: Filter-First 1.dotProduct ═══');
  const deleted = await deleteIndex();
  if (deleted) await new Promise(r => setTimeout(r, waitAfterDeleteMs));
  await createIndex();
  await sovereignIndexGuard();
  return { queryable: true };
}

export async function sovereignIndexGuard(options = {}) {
  const { pollIntervalMs = 5000, timeoutMs = 120000 } = options;
  const collection = mongoose.connection.collection(VECTOR_COLLECTION);
  const startTime = Date.now();
  while (true) {
    if (Date.now() - startTime > timeoutMs) throw new Error('Index readiness timeout');
    const cursor = collection.listSearchIndexes();
    for await (const index of cursor) {
      if (index.name === VECTOR_INDEX_NAME && index.queryable) {
        logger.info(`[SovereignHandshake] '${VECTOR_INDEX_NAME}' is queryable.`);
        return true;
      }
    }
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
}

// ─── CREDENTIAL VERIFICATION ────────────────────────────────────────────────────────────

async function verifyShopifyToken() {
  try {
    const data = await shopifyRest('/shop.json');
    return { success: !!data?.shop?.id, shop: data?.shop };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function verifySellviaKey() {
  const apiKey = process.env.SELLVIA_API_KEY;
  if (!apiKey) return { success: false, error: 'Key not set' };
  try {
    const res = await fetch(`${SELLVIA_BASE_URL}/account/verify`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return { success: res.ok, status: res.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function verifyHandshake() {
  const [shopify, sellvia] = await Promise.all([verifyShopifyToken(), verifySellviaKey()]);
  const status = shopify.success && sellvia.success ? 'SOVEREIGN' : 'DEGRADED';
  return { status, shopify, sellvia };
}

export default { verifyHandshake, recreateIndex, HANDSHAKE_VERSION };
