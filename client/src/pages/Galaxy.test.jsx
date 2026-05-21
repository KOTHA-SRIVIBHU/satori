import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Galaxy from '../pages/Galaxy';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  getAnimeDNA: vi.fn(),
}));

describe('Galaxy Page', () => {
  it('renders the Galaxy map heading', async () => {
    api.getAnimeDNA.mockResolvedValue({
      success: true,
      data: [
        { id: 1, title: 'Test Anime', x: 50, y: 50, genres: ['Action'] }
      ]
    });

    render(
      <BrowserRouter>
        <Galaxy />
      </BrowserRouter>
    );

    expect(screen.getByText(/The Anime/i)).toBeInTheDocument();
    expect(screen.getByText(/Galaxy/i)).toBeInTheDocument();
  });
});
