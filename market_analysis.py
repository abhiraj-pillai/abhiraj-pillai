"""Market analysis: yield curve, signals, sector rotation, and summary generation."""


def analyze_yield_curve(yields_dict):
    """Compute yield spreads and detect inversions.

    Args:
        yields_dict: {"2Y": {"yield": 4.5, ...}, "10Y": {"yield": 4.2, ...}, ...}

    Returns:
        dict with spread values and status strings.
    """
    result = {"spreads": {}, "warnings": []}

    y2 = yields_dict.get("2Y", {}).get("yield")
    y5 = yields_dict.get("5Y", {}).get("yield")
    y10 = yields_dict.get("10Y", {}).get("yield")
    y30 = yields_dict.get("30Y", {}).get("yield")

    if y10 is not None and y2 is not None:
        spread_10_2 = y10 - y2
        result["spreads"]["10Y-2Y"] = round(spread_10_2, 3)
        if spread_10_2 < 0:
            result["warnings"].append(
                f"YIELD CURVE INVERTED: 10Y-2Y spread at {spread_10_2:+.3f}%. "
                "Historically, inversions have preceded recessions by 12-18 months."
            )
        elif spread_10_2 < 0.25:
            result["warnings"].append(
                f"Yield curve is FLAT: 10Y-2Y spread at {spread_10_2:+.3f}%. "
                "Markets may be pricing in slowing growth or rate cuts."
            )

    if y30 is not None and y10 is not None:
        result["spreads"]["30Y-10Y"] = round(y30 - y10, 3)

    if y10 is not None and y5 is not None:
        result["spreads"]["10Y-5Y"] = round(y10 - y5, 3)

    return result


def analyze_fed_impact(fed_data):
    """Determine Fed cycle (hiking/cutting/holding) and comment on impact.

    Args:
        fed_data: dict from MacroDataFetcher.get_fed_policy()

    Returns:
        dict with cycle status and commentary.
    """
    if not fed_data:
        return None

    result = {}
    current = fed_data.get("current_rate")
    rate_3m = fed_data.get("rate_3m_ago")
    rate_1y = fed_data.get("rate_1y_ago")

    if current is None:
        return None

    result["current_rate"] = current
    result["rate_date"] = fed_data.get("rate_date", "N/A")

    # Determine cycle
    if rate_3m is not None:
        diff_3m = current - rate_3m
        if diff_3m > 0.10:
            result["cycle"] = "HIKING"
            result["commentary"] = (
                f"Fed has raised rates by {diff_3m:+.2f}% over the past 3 months. "
                "Tightening policy tends to pressure equity valuations and support the dollar."
            )
        elif diff_3m < -0.10:
            result["cycle"] = "CUTTING"
            result["commentary"] = (
                f"Fed has cut rates by {abs(diff_3m):.2f}% over the past 3 months. "
                "Easing policy is generally supportive of equities and bonds."
            )
        else:
            result["cycle"] = "HOLDING"
            result["commentary"] = (
                "Fed funds rate has been stable over the past 3 months. "
                "Markets are watching for signals of the next policy shift."
            )
    else:
        result["cycle"] = "UNKNOWN"
        result["commentary"] = "Insufficient historical data to determine Fed cycle."

    # Year-over-year context
    if rate_1y is not None:
        diff_1y = current - rate_1y
        result["yoy_change"] = diff_1y
        if abs(diff_1y) > 0.10:
            direction = "higher" if diff_1y > 0 else "lower"
            result["commentary"] += (
                f" Rate is {abs(diff_1y):.2f}% {direction} than one year ago."
            )

    return result


def analyze_sector_rotation(sector_data):
    """Identify leading/lagging sectors and risk sentiment.

    Args:
        sector_data: dict from EquityDataFetcher.get_sector_performance()

    Returns:
        dict with top/bottom sectors and sentiment assessment.
    """
    if not sector_data:
        return None

    sorted_daily = sorted(sector_data.items(), key=lambda x: x[1].get("daily_pct", 0), reverse=True)

    top_3 = [(name, info) for name, info in sorted_daily[:3]]
    bottom_3 = [(name, info) for name, info in sorted_daily[-3:]]

    # Risk sentiment: defensive sectors = Utilities, Cons. Staples, Health Care
    defensive = {"Utilities", "Cons. Staples", "Health Care"}
    top_names = {name for name, _ in top_3}

    defensive_leading = len(top_names & defensive)
    if defensive_leading >= 2:
        sentiment = "RISK-OFF"
        sentiment_detail = (
            "Defensive sectors (Utilities, Staples, Healthcare) are outperforming, "
            "suggesting investors are rotating into safety."
        )
    else:
        cyclical = {"Technology", "Cons. Discret.", "Financials", "Industrials"}
        cyclical_leading = len(top_names & cyclical)
        if cyclical_leading >= 2:
            sentiment = "RISK-ON"
            sentiment_detail = (
                "Cyclical sectors (Tech, Discretionary, Financials) are leading, "
                "indicating appetite for growth and risk assets."
            )
        else:
            sentiment = "MIXED"
            sentiment_detail = "Sector leadership is mixed with no clear risk-on or risk-off signal."

    return {
        "top_3": top_3,
        "bottom_3": bottom_3,
        "sentiment": sentiment,
        "sentiment_detail": sentiment_detail,
    }


def generate_market_summary(index_data, yields_data, yield_analysis, fed_analysis, sector_analysis):
    """Produce a 2-3 sentence market narrative.

    Returns:
        str: Plain-English summary.
    """
    parts = []

    # Equity summary
    if index_data:
        sp = index_data.get("S&P 500")
        if sp:
            direction = "up" if sp["daily_pct"] >= 0 else "down"
            parts.append(
                f"The S&P 500 is {direction} {abs(sp['daily_pct']):.2f}% today "
                f"at {sp['price']:,.2f}, with YTD performance at {sp['ytd_pct']:+.2f}%."
            )

    # Yield curve
    if yield_analysis and yield_analysis.get("warnings"):
        parts.append(yield_analysis["warnings"][0])

    # Fed
    if fed_analysis and fed_analysis.get("cycle"):
        cycle = fed_analysis["cycle"]
        rate = fed_analysis.get("current_rate", 0)
        if cycle == "CUTTING":
            parts.append(f"The Fed is in a rate-cutting cycle (current rate: {rate:.2f}%), generally supportive of risk assets.")
        elif cycle == "HIKING":
            parts.append(f"The Fed continues to tighten (current rate: {rate:.2f}%), which may weigh on valuations.")
        elif cycle == "HOLDING":
            parts.append(f"The Fed is holding steady at {rate:.2f}%, with markets watching for the next move.")

    # Sector sentiment
    if sector_analysis and sector_analysis.get("sentiment"):
        sent = sector_analysis["sentiment"]
        if sent == "RISK-OFF":
            parts.append("Sector rotation signals risk-off sentiment as defensive names lead.")
        elif sent == "RISK-ON":
            parts.append("Sector rotation favors cyclicals, pointing to risk-on sentiment.")

    return " ".join(parts) if parts else "Market data is currently unavailable."
