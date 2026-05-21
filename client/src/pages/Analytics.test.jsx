import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../pages/Analytics';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  getAnalytics: vi.fn(),
}));

describe('Analytics Page', () => {
  it('renders the analytics heading and loading state', async () => {
    api.getAnalytics.mockReturnValue(new Promise(() => {})); // Never resolves to keep loading

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    expect(screen.getByText(/Aggregating Global Trends/i)).toBeInTheDocument();
  });

  it('renders the charts after data loads', async () => {
    api.getAnalytics.mockResolvedValue({
      success: true,
      data: {
        genrePopularity: [{ _id: 'Action', count: 10 }],
        scoreTrends: [{ decade: '2020s', avgScore: 85 }]
      }
    });

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    const heading = await screen.findByText(/Global/i);
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/Genre Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Score Trends/i)).toBeInTheDocument();
  });
});
