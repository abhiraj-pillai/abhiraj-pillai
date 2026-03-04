import logging
import os
from datetime import datetime, timedelta

import yfinance as yf

# Suppress noisy yfinance download errors (shown in stderr)
logging.getLogger("yfinance").setLevel(logging.CRITICAL)


# --- Ticker Maps ---

INDEX_TICKERS = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "Dow Jones": "^DJI",
    "Russell 2000": "^RUT",
}

TREASURY_TICKERS = {
    "5Y": "^FVX",
    "10Y": "^TNX",
    "30Y": "^TYX",
}

SECTOR_TICKERS = {
    "Technology": "XLK",
    "Financials": "XLF",
    "Energy": "XLE",
    "Health Care": "XLV",
    "Industrials": "XLI",
    "Comm. Services": "XLC",
    "Cons. Staples": "XLP",
    "Materials": "XLB",
    "Real Estate": "XLRE",
    "Cons. Discret.": "XLY",
    "Utilities": "XLU",
}


class EquityDataFetcher:
    """Fetches equity, treasury, and sector data from Yahoo Finance."""

    def get_index_data(self):
        """Fetch major index prices, daily change %, and YTD change %."""
        results = {}
        tickers_str = " ".join(INDEX_TICKERS.values())
        data = yf.download(tickers_str, period="ytd", group_by="ticker", progress=False)

        for name, ticker in INDEX_TICKERS.items():
            try:
                if len(INDEX_TICKERS) == 1:
                    ticker_data = data
                else:
                    ticker_data = data[ticker]

                if ticker_data.empty:
                    continue

                current = float(ticker_data["Close"].iloc[-1])
                prev = float(ticker_data["Close"].iloc[-2]) if len(ticker_data) > 1 else current
                ytd_start = float(ticker_data["Close"].iloc[0])

                daily_chg = current - prev
                daily_pct = (daily_chg / prev) * 100 if prev else 0
                ytd_pct = ((current - ytd_start) / ytd_start) * 100 if ytd_start else 0

                results[name] = {
                    "price": current,
                    "daily_chg": daily_chg,
                    "daily_pct": daily_pct,
                    "ytd_pct": ytd_pct,
                }
            except Exception:
                continue

        return results

    def get_treasury_yields(self):
        """Fetch treasury yield data. Uses yfinance for 5Y/10Y/30Y, attempts 2Y separately."""
        results = {}

        # Fetch 5Y, 10Y, 30Y from yfinance
        tickers_str = " ".join(TREASURY_TICKERS.values())
        data = yf.download(tickers_str, period="5d", group_by="ticker", progress=False)

        for label, ticker in TREASURY_TICKERS.items():
            try:
                if len(TREASURY_TICKERS) == 1:
                    ticker_data = data
                else:
                    ticker_data = data[ticker]

                if ticker_data.empty:
                    continue

                current = float(ticker_data["Close"].iloc[-1])
                prev = float(ticker_data["Close"].iloc[-2]) if len(ticker_data) > 1 else current
                chg = current - prev

                results[label] = {"yield": current, "change": chg}
            except Exception:
                continue

        # Attempt 2Y yield from yfinance
        try:
            data_2y = yf.download("^AXTWO", period="5d", progress=False)
            if not data_2y.empty:
                current = float(data_2y["Close"].iloc[-1])
                prev = float(data_2y["Close"].iloc[-2]) if len(data_2y) > 1 else current
                results["2Y"] = {"yield": current, "change": current - prev}
        except Exception:
            pass

        # Fallback: try FRED for 2Y if not found
        if "2Y" not in results:
            try:
                fred_data = _get_fred_series("DGS2", days=10)
                if fred_data is not None and len(fred_data.dropna()) >= 1:
                    vals = fred_data.dropna()
                    current = float(vals.iloc[-1])
                    prev = float(vals.iloc[-2]) if len(vals) > 1 else current
                    results["2Y"] = {"yield": current, "change": current - prev}
            except Exception:
                pass

        return results

    def get_sector_performance(self):
        """Fetch sector ETF daily and YTD performance."""
        results = {}
        tickers_str = " ".join(SECTOR_TICKERS.values())
        data = yf.download(tickers_str, period="ytd", group_by="ticker", progress=False)

        for name, ticker in SECTOR_TICKERS.items():
            try:
                ticker_data = data[ticker]
                if ticker_data.empty:
                    continue

                current = float(ticker_data["Close"].iloc[-1])
                prev = float(ticker_data["Close"].iloc[-2]) if len(ticker_data) > 1 else current
                ytd_start = float(ticker_data["Close"].iloc[0])

                daily_pct = ((current - prev) / prev) * 100 if prev else 0
                ytd_pct = ((current - ytd_start) / ytd_start) * 100 if ytd_start else 0

                results[name] = {
                    "ticker": ticker,
                    "daily_pct": daily_pct,
                    "ytd_pct": ytd_pct,
                }
            except Exception:
                continue

        return results


class MacroDataFetcher:
    """Fetches macroeconomic data from FRED. Requires FRED_API_KEY env var."""

    MACRO_SERIES = {
        "Real GDP": {"id": "GDPC1", "unit": "$ Billions", "freq": "Quarterly"},
        "CPI": {"id": "CPIAUCSL", "unit": "Index", "freq": "Monthly"},
        "Unemployment": {"id": "UNRATE", "unit": "%", "freq": "Monthly"},
        "ISM Mfg PMI": {"id": "NAPM", "unit": "Index", "freq": "Monthly"},
        "Consumer Sentiment": {"id": "UMCSENT", "unit": "Index", "freq": "Monthly"},
    }

    def __init__(self):
        self.api_key = os.environ.get("FRED_API_KEY")
        self.fred = None
        if self.api_key:
            try:
                from fredapi import Fred
                self.fred = Fred(api_key=self.api_key)
            except Exception:
                self.fred = None

    @property
    def available(self):
        return self.fred is not None

    def get_macro_indicators(self):
        """Fetch latest macro indicator values."""
        if not self.available:
            return None

        results = {}
        for name, info in self.MACRO_SERIES.items():
            try:
                series = self.fred.get_series(info["id"])
                series = series.dropna()
                if series.empty:
                    continue

                latest = float(series.iloc[-1])
                prior = float(series.iloc[-2]) if len(series) > 1 else None
                date = series.index[-1].strftime("%Y-%m-%d")

                results[name] = {
                    "value": latest,
                    "prior": prior,
                    "date": date,
                    "unit": info["unit"],
                    "freq": info["freq"],
                }
            except Exception:
                continue

        return results

    def get_fed_policy(self):
        """Fetch Fed Funds Rate and recent history."""
        if not self.available:
            return None

        result = {}

        # Daily effective rate
        try:
            dff = self.fred.get_series("DFF")
            dff = dff.dropna()
            if not dff.empty:
                result["current_rate"] = float(dff.iloc[-1])
                result["rate_date"] = dff.index[-1].strftime("%Y-%m-%d")

                # Get rate from 3 months ago for trend
                three_months_ago = dff.index[-1] - timedelta(days=90)
                older = dff[dff.index <= three_months_ago]
                if not older.empty:
                    result["rate_3m_ago"] = float(older.iloc[-1])
                else:
                    result["rate_3m_ago"] = None

                # Get rate from 1 year ago
                one_year_ago = dff.index[-1] - timedelta(days=365)
                older_1y = dff[dff.index <= one_year_ago]
                if not older_1y.empty:
                    result["rate_1y_ago"] = float(older_1y.iloc[-1])
                else:
                    result["rate_1y_ago"] = None
        except Exception:
            pass

        # FRED treasury yields as supplement
        try:
            for label, series_id in [("2Y", "DGS2"), ("5Y", "DGS5"), ("10Y", "DGS10"), ("30Y", "DGS30")]:
                s = self.fred.get_series(series_id)
                s = s.dropna()
                if not s.empty:
                    result[f"yield_{label}"] = float(s.iloc[-1])
        except Exception:
            pass

        return result if result else None


def _get_fred_series(series_id, days=30):
    """Helper to fetch a FRED series without requiring MacroDataFetcher."""
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        return None
    try:
        from fredapi import Fred
        fred = Fred(api_key=api_key)
        start = datetime.now() - timedelta(days=days)
        return fred.get_series(series_id, observation_start=start)
    except Exception:
        return None
