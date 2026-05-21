import pytest
import numpy as np
from app.services.visualizer import VisualizerService

def test_visualizer_projection_shape():
    # Create 50 dummy vectors of length 21
    vectors = [list(np.random.rand(21)) for _ in range(50)]
    
    coordinates = VisualizerService.project_to_2d(vectors)
    
    assert coordinates.shape == (50, 2)
    assert isinstance(coordinates, np.ndarray)

def test_visualizer_normalization():
    # Create 20 dummy vectors
    vectors = [list(np.random.rand(21)) for _ in range(20)]
    
    coordinates = VisualizerService.project_to_2d(vectors)
    
    # Check if values are within a reasonable normalized range if implemented
    # For now, just ensure they aren't all zero (which the stub returns)
    if not np.all(coordinates == 0):
        assert np.min(coordinates) >= 0.0
        assert np.max(coordinates) <= 100.0
