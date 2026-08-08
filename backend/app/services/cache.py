import time
import hashlib
import re
from collections import OrderedDict

class QueryCache:
    def __init__(self, max_size=500, ttl_seconds=1800):
        self._cache = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl_seconds
    
    def _normalize_key(self, question: str) -> str:
        # Lowercase, strip, remove extra spaces, remove punctuation
        q = question.lower().strip()
        q = re.sub(r'[^a-z0-9\s]', '', q)
        q = re.sub(r'\s+', ' ', q)
        return hashlib.md5(q.encode()).hexdigest()
    
    def get(self, question: str) -> dict | None:
        key = self._normalize_key(question)
        if key not in self._cache:
            return None
        entry = self._cache[key]
        if time.time() - entry['timestamp'] > self._ttl:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return entry['data']
    
    def set(self, question: str, data: dict):
        key = self._normalize_key(question)
        if key in self._cache:
            del self._cache[key]
        elif len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = {
            'timestamp': time.time(),
            'data': data
        }
    
    def clear(self):
        self._cache.clear()
    
    @property
    def size(self):
        return len(self._cache)

# Global singleton
query_cache = QueryCache()
