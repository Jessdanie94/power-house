/**
 * vectorSearchNode.js — MongoDB Atlas Vector Search (mongot) integration
 * 
 * Uses $vectorSearch aggregation stage with HNSW indexing.
 * Index: cosine similarity, 1536 dimensions (OpenAI/Gemini embedding standard).
 * HNSW: maxEdges 64 (official max), numEdgeCandidates 3200 (official max).
 * Optimized with BinData (Subtype 16) for array(float32), binData(float32), binData(int8), binData(int1).
 * 
 * Enterprise-Compliant — Jesse Daniels Ventures, July 2026
 */

const mongoose = require('mongoose');
const { Binary } = require('mongodb');
const VendorInventory = require('../models/VendorInventory');

const INDEX_NAME = 'vector_index';

/**
 * numDimensions — MUST be a strict Integer (Int), never a string.
 * Required by MongoDB Atlas $vectorSearch index specification.
 */
const NUM_DIMENSIONS = 1536; // Int — Required
let indexReady = false;

/**
 * Poll Atlas until the mongot vector search index is queryable.
 */
async function ensureIndexReady(pollIntervalMs = 5000, timeoutMs = 120000) {
  if (indexReady) return;

  console.log('Polling to check if the mongot index is ready...');

  const collection = mongoose.connection.collection('vendorinventories');
  const startTime = Date.now();
  let isQueryable = false;

  while (!isQueryable) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timed out waiting for vector index '${INDEX_NAME}' to become queryable after ${timeoutMs / 1000}s`);
    }

    const cursor = collection.listSearchIndexes();
    for await (const index of cursor) {
      if (index.name === INDEX_NAME) {
        if (index.queryable) {
          console.log(`${INDEX_NAME} is ready for querying.`);
          isQueryable = true;
          indexReady = true;
        } else {
          console.log(`${INDEX_NAME} not yet queryable, retrying in ${pollIntervalMs / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
      }
    }

    if (!isQueryable) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
}

/**
 * Search for similar products using vector embeddings.
 * Uses cosine similarity with numCandidates: 3200 (ANN-hardened).
 */
async function searchSimilarProducts(queryVector, limit = 100, filter = {}) {
  // Support for BinData queryVector or array
  const vector = Array.isArray(queryVector) ? queryVector : queryVector;

  await ensureIndexReady();

  const pipeline = [
    {
      $vectorSearch: {
        index: INDEX_NAME,
        path: 'embedding',
        queryVector: vector,
        numCandidates: 3200,
        limit,
        ...(Object.keys(filter).length > 0 && { filter })
      }
    },
    {
      $addFields: {
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  const results = await VendorInventory.aggregate(pipeline);
  return results;
}

/**
 * Generate and store an embedding for a VendorInventory document.
 * Defaults to float32 BinData (Subtype 16) for maximum precision.
 * 
 * @param {string} docId - The document _id to embed
 * @param {number[]} embedding - Pre-computed embedding vector
 * @param {string} [type='float32'] - Vector type: 'float32', 'int8', or 'int1'
 */
async function storeEmbedding(docId, embedding, type = 'float32') {
  if (!embedding || embedding.length !== NUM_DIMENSIONS) {
    throw new Error(`Embedding must be ${NUM_DIMENSIONS} dimensions. Got: ${embedding?.length || 0}`);
  }

  let buffer;
  if (type === 'float32') {
    buffer = Buffer.from(new Float32Array(embedding).buffer);
  } else if (type === 'int8') {
    buffer = Buffer.from(new Int8Array(embedding).buffer);
  } else if (type === 'int1') {
    // Placeholder for bit-packing logic
    throw new Error('int1 (bit vector) storage logic not yet implemented');
  } else {
    throw new Error(`Unsupported vector type: ${type}`);
  }

  // Use BinData subtype 16 (0x10) for optimized vector storage
  const vectorBinary = new Binary(buffer, 16);

  await VendorInventory.findByIdAndUpdate(docId, { embedding: vectorBinary });
}

module.exports = {
  ensureIndexReady,
  searchSimilarProducts,
  storeEmbedding
};
