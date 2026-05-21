import umap
import numpy as np
from typing import List

class VisualizerService:
    @staticmethod
    def project_to_2d(vectors: List[List[float]]) -> np.ndarray:
        if not vectors:
            return np.array([])
            
        # 1. Dimensionality Reduction
        reducer = umap.UMAP(
            n_components=2,
            n_neighbors=15,
            min_dist=0.1,
            metric='cosine',
            random_state=42 # For stability in tests
        )
        
        embedding = reducer.fit_transform(vectors)
        
        # 2. Normalization (Scale to 0-100)
        x_min, x_max = embedding[:, 0].min(), embedding[:, 0].max()
        y_min, y_max = embedding[:, 1].min(), embedding[:, 1].max()
        
        # Avoid division by zero
        x_range = (x_max - x_min) if (x_max - x_min) > 0 else 1
        y_range = (y_max - y_min) if (y_max - y_min) > 0 else 1
        
        normalized = np.zeros_like(embedding)
        normalized[:, 0] = (embedding[:, 0] - x_min) / x_range * 100.0
        normalized[:, 1] = (embedding[:, 1] - y_min) / y_range * 100.0
        
        return normalized
