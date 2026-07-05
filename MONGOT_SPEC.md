# MongoDB Atlas Vector Search — Elite Specification (v1.2)

## Index: vector_index
**Structure**: Filter-First (Index 0: Filter, Index 1: Vector)

```json
{
  "fields": [
    {
      "type": "filter",
      "path": "vendors.vendorName"
    },
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "dotProduct",
      "quantization": "none",
      "indexingMethod": "hnsw",
      "hnswOptions": {
        "maxEdges": 64,
        "numEdgeCandidates": 3200
      }
    }
  ]
}
```

### Enterprise Constraints
- **numDimensions**: 1536 (Raw Integer)
- **maxEdges**: 64 (Official Maximum)
- **numEdgeCandidates**: 3200 (Official Maximum)
- **Similarity**: dotProduct (Recommended for normalized float32 vectors)
- **Storage**: BinData Subtype 16 (array/binData float32 support)

### Lifecycle
Managed by `services/sovereignHandshake.js` via `recreateIndex()`.
