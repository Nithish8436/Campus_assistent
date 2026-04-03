import os
import hashlib

# Lazy load to avoid startup crashes
_model = None


def get_model():
    """Simple hash-based embedding model to avoid torch/transformers conflicts."""
    return None


def embed_text(text: str) -> list[float]:
    """Return a 384-dimension embedding vector for the input text using hashing."""
    # Create a simple 384-dimensional embedding from text using hash
    hash_bytes = hashlib.sha256(text.encode()).digest()
    
    # Expand to 384 dimensions
    embedding = []
    for i in range(384):
        # Use cyclic hash bytes to create 384 dimensions
        byte_idx = i % len(hash_bytes)
        embedding.append((hash_bytes[byte_idx] - 128) / 128.0)
    
    return embedding


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts using hashing."""
    return [embed_text(text) for text in texts]
