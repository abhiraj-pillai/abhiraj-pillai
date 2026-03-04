"""
Financial Markets Tracking Dashboard

Tracks fixed income and equity markets, macroeconomic indicators,
central bank policy decisions, and their impact on asset pricing.

Usage:
    python market_tracker.py

Optional:
    Set FRED_API_KEY environment variable for macroeconomic data.
    Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html
"""

import sys

from dotenv import load_dotenv
from rich.console import Console

from data_fetcher import EquityDataFetcher, MacroDataFetcher
from market_analysis import (
    analyze_fed_impact,
    analyze_sector_rotation,
    analyze_yield_curve,
    generate_market_summary,
)
from display import render_dashboard


def main():
    load_dotenv()

    console = Console()
    errors = []

    equity_fetcher = EquityDataFetcher()
    macro_fetcher = MacroDataFetcher()

    # Fetch all data with per-section error handling
    with console.status("[bold cyan]Fetching market data...", spinner="dots"):
        # Equity indices
        index_data = {}
        try:
            index_data = equity_fetcher.get_index_data()
        except Exception as e:
            errors.append(f"Equity indices: {e}")

        # Treasury yields
        yields_data = {}
        try:
            yields_data = equity_fetcher.get_treasury_yields()
        except Exception as e:
            errors.append(f"Treasury yields: {e}")

        # Sector performance
        sector_data = {}
        try:
            sector_data = equity_fetcher.get_sector_performance()
        except Exception as e:
            errors.append(f"Sector data: {e}")

        # Macro indicators (FRED)
        macro_data = None
        if macro_fetcher.available:
            try:
                macro_data = macro_fetcher.get_macro_indicators()
            except Exception as e:
                errors.append(f"Macro indicators: {e}")

        # Fed policy (FRED)
        fed_data = None
        if macro_fetcher.available:
            try:
                fed_data = macro_fetcher.get_fed_policy()
            except Exception as e:
                errors.append(f"Fed policy: {e}")

    # Run analysis
    yield_analysis = analyze_yield_curve(yields_data) if yields_data else {}
    fed_analysis = analyze_fed_impact(fed_data)
    sector_analysis = analyze_sector_rotation(sector_data)

    summary = generate_market_summary(
        index_data, yields_data, yield_analysis, fed_analysis, sector_analysis
    )

    # Render dashboard
    data = {
        "index_data": index_data,
        "yields_data": yields_data,
        "sector_data": sector_data,
        "macro_data": macro_data,
    }

    render_dashboard(data, yield_analysis, fed_analysis, sector_analysis, summary, errors)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting.")
        sys.exit(0)
