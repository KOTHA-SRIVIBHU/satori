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
        
        # 2. Gravity Well (Pull islands closer to the center)
        # Find the centroid of the main mass (using median to ignore extreme outliers)
        cx, cy = np.median(embedding[:, 0]), np.median(embedding[:, 1])
        
        for i in range(len(embedding)):
            dx = embedding[i, 0] - cx
            dy = embedding[i, 1] - cy
            dist = np.hypot(dx, dy)
            if dist > 0:
                # Compress distances using a power < 1.0 (pulls far points much closer, affects near points less)
                new_dist = dist ** 0.6
                embedding[i, 0] = cx + (dx / dist) * new_dist
                embedding[i, 1] = cy + (dy / dist) * new_dist
                
        # 3. Normalization (Scale to 0-100)
        x_min, x_max = embedding[:, 0].min(), embedding[:, 0].max()
        y_min, y_max = embedding[:, 1].min(), embedding[:, 1].max()
        
        # Add 5% padding so islands don't touch the absolute edge
        x_padding = (x_max - x_min) * 0.05
        y_padding = (y_max - y_min) * 0.05
        x_min -= x_padding
        x_max += x_padding
        y_min -= y_padding
        y_max += y_padding
        
        x_range = (x_max - x_min) if (x_max - x_min) > 0 else 1
        y_range = (y_max - y_min) if (y_max - y_min) > 0 else 1
        
        normalized = np.zeros_like(embedding)
        normalized[:, 0] = (embedding[:, 0] - x_min) / x_range * 100.0
        normalized[:, 1] = (embedding[:, 1] - y_min) / y_range * 100.0
        
        # Clip to ensure bounds
        normalized = np.clip(normalized, 0, 100)
        
        return normalized
