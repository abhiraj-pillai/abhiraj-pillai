"""Rich terminal dashboard rendering for Market Tracker."""

from datetime import datetime

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text


def _fmt_change(value, suffix="%"):
    """Format a numeric change with color and arrow."""
    if value is None:
        return Text("N/A", style="dim")
    style = "green" if value >= 0 else "red"
    arrow = "▲" if value >= 0 else "▼"
    return Text(f"{arrow} {value:+.2f}{suffix}", style=style)


def _fmt_price(value):
    """Format a price value."""
    if value is None:
        return Text("N/A", style="dim")
    return Text(f"{value:,.2f}")


def render_header():
    """Render the dashboard header panel."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    title_text = Text()
    title_text.append("Financial Markets Dashboard", style="bold cyan")
    title_text.append(f"\n{now}", style="dim")
    title_text.append("  |  Sources: Yahoo Finance, FRED", style="dim")
    return Panel(title_text, box=box.DOUBLE, style="cyan")


def render_equities(index_data):
    """Render equity indices table."""
    table = Table(
        title="Major Indices",
        box=box.SIMPLE_HEAVY,
        title_style="bold white",
        header_style="bold",
        show_lines=False,
    )
    table.add_column("Index", style="white", min_width=12)
    table.add_column("Price", justify="right", min_width=12)
    table.add_column("Daily Chg", justify="right", min_width=10)
    table.add_column("Daily %", justify="right", min_width=10)
    table.add_column("YTD %", justify="right", min_width=10)

    if not index_data:
        table.add_row("No data available", "", "", "", "")
    else:
        for name, info in index_data.items():
            table.add_row(
                name,
                _fmt_price(info.get("price")),
                _fmt_change(info.get("daily_chg"), suffix=""),
                _fmt_change(info.get("daily_pct")),
                _fmt_change(info.get("ytd_pct")),
            )

    return Panel(table, title="[bold]Equity Markets[/bold]", border_style="blue", box=box.ROUNDED)


def render_fixed_income(yields_data, yield_analysis):
    """Render treasury yields and spread analysis."""
    table = Table(
        title="US Treasury Yields",
        box=box.SIMPLE_HEAVY,
        title_style="bold white",
        header_style="bold",
    )
    table.add_column("Maturity", style="white", min_width=10)
    table.add_column("Yield", justify="right", min_width=10)
    table.add_column("Change", justify="right", min_width=10)

    # Order: 2Y, 5Y, 10Y, 30Y
    order = ["2Y", "5Y", "10Y", "30Y"]
    if not yields_data:
        table.add_row("No data available", "", "")
    else:
        for label in order:
            info = yields_data.get(label)
            if info:
                yield_val = info.get("yield")
                chg = info.get("change")
                yield_text = Text(f"{yield_val:.3f}%") if yield_val is not None else Text("N/A", style="dim")
                chg_text = _fmt_change(chg, suffix="%") if chg is not None else Text("N/A", style="dim")
                table.add_row(label, yield_text, chg_text)
            else:
                table.add_row(label, Text("N/A", style="dim"), Text("N/A", style="dim"))

    # Add spread info below table
    content = Text()
    content.append("\n")

    if yield_analysis and yield_analysis.get("spreads"):
        spreads = yield_analysis["spreads"]
        content.append("Spreads:  ", style="bold")
        for spread_name, spread_val in spreads.items():
            style = "red bold" if spread_val < 0 else "green"
            label = f"  {spread_name}: "
            content.append(label, style="white")
            content.append(f"{spread_val:+.3f}%", style=style)
            if spread_val < 0:
                content.append(" INVERTED", style="red bold")

    if yield_analysis and yield_analysis.get("warnings"):
        content.append("\n")
        for warning in yield_analysis["warnings"]:
            content.append(f"\n⚠ {warning}", style="yellow")

    from rich.console import Group
    group = Group(table, content)
    return Panel(group, title="[bold]Fixed Income[/bold]", border_style="yellow", box=box.ROUNDED)


def render_sectors(sector_data, sector_analysis):
    """Render sector performance table."""
    table = Table(
        title="S&P 500 Sector ETFs",
        box=box.SIMPLE_HEAVY,
        title_style="bold white",
        header_style="bold",
    )
    table.add_column("Sector", style="white", min_width=16)
    table.add_column("ETF", style="dim", min_width=6)
    table.add_column("Daily %", justify="right", min_width=10)
    table.add_column("YTD %", justify="right", min_width=10)

    if not sector_data:
        table.add_row("No data available", "", "", "")
    else:
        # Sort by daily performance
        sorted_sectors = sorted(
            sector_data.items(), key=lambda x: x[1].get("daily_pct", 0), reverse=True
        )
        for name, info in sorted_sectors:
            table.add_row(
                name,
                info.get("ticker", ""),
                _fmt_change(info.get("daily_pct")),
                _fmt_change(info.get("ytd_pct")),
            )

    # Sector sentiment
    content = Text()
    if sector_analysis:
        sentiment = sector_analysis.get("sentiment", "")
        detail = sector_analysis.get("sentiment_detail", "")
        style_map = {"RISK-ON": "green bold", "RISK-OFF": "red bold", "MIXED": "yellow"}
        content.append(f"\nSentiment: ", style="bold")
        content.append(sentiment, style=style_map.get(sentiment, "white"))
        content.append(f"\n{detail}", style="dim")

    from rich.console import Group
    group = Group(table, content)
    return Panel(group, title="[bold]Sector Performance[/bold]", border_style="magenta", box=box.ROUNDED)


def render_macro(macro_data):
    """Render macroeconomic indicators table."""
    if macro_data is None:
        note = Text(
            "Macroeconomic data unavailable.\n"
            "Set FRED_API_KEY environment variable for macro indicators.\n"
            "Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html",
            style="dim italic",
        )
        return Panel(note, title="[bold]Macroeconomic Indicators[/bold]", border_style="green", box=box.ROUNDED)

    table = Table(
        box=box.SIMPLE_HEAVY,
        title_style="bold white",
        header_style="bold",
    )
    table.add_column("Indicator", style="white", min_width=20)
    table.add_column("Latest", justify="right", min_width=12)
    table.add_column("Prior", justify="right", min_width=12)
    table.add_column("Date", justify="right", min_width=12)
    table.add_column("Frequency", style="dim", min_width=10)

    if not macro_data:
        table.add_row("No data available", "", "", "", "")
    else:
        for name, info in macro_data.items():
            val = info.get("value")
            prior = info.get("prior")
            unit = info.get("unit", "")

            if val is not None:
                val_str = f"{val:,.2f}" if isinstance(val, float) else str(val)
                if unit == "%":
                    val_str += "%"
            else:
                val_str = "N/A"

            if prior is not None:
                prior_str = f"{prior:,.2f}" if isinstance(prior, float) else str(prior)
                if unit == "%":
                    prior_str += "%"
            else:
                prior_str = "N/A"

            # Trend arrow
            if val is not None and prior is not None:
                if val > prior:
                    trend_style = "green" if name != "Unemployment" else "red"
                    val_str = f"▲ {val_str}"
                elif val < prior:
                    trend_style = "red" if name != "Unemployment" else "green"
                    val_str = f"▼ {val_str}"
                else:
                    trend_style = "white"
                    val_str = f"= {val_str}"
            else:
                trend_style = "white"

            table.add_row(
                name,
                Text(val_str, style=trend_style),
                prior_str,
                info.get("date", "N/A"),
                info.get("freq", ""),
            )

    return Panel(table, title="[bold]Macroeconomic Indicators[/bold]", border_style="green", box=box.ROUNDED)


def render_fed_policy(fed_analysis):
    """Render central bank policy panel."""
    if not fed_analysis:
        note = Text("Fed policy data unavailable.", style="dim italic")
        return Panel(note, title="[bold]Central Bank Policy[/bold]", border_style="red", box=box.ROUNDED)

    content = Text()

    rate = fed_analysis.get("current_rate")
    if rate is not None:
        content.append("Fed Funds Rate (Effective): ", style="bold")
        content.append(f"{rate:.2f}%\n", style="white")

    date = fed_analysis.get("rate_date")
    if date:
        content.append(f"As of: {date}\n", style="dim")

    cycle = fed_analysis.get("cycle")
    if cycle:
        cycle_styles = {"HIKING": "red bold", "CUTTING": "green bold", "HOLDING": "yellow bold"}
        content.append("\nPolicy Stance: ", style="bold")
        content.append(cycle, style=cycle_styles.get(cycle, "white"))
        content.append("\n")

    commentary = fed_analysis.get("commentary")
    if commentary:
        content.append(f"\n{commentary}", style="dim")

    return Panel(content, title="[bold]Central Bank Policy[/bold]", border_style="red", box=box.ROUNDED)


def render_market_summary(summary):
    """Render the overall market impact analysis panel."""
    if not summary:
        summary = "Insufficient data for market analysis."

    content = Text(summary, style="white")

    return Panel(
        content,
        title="[bold]Market Impact Analysis[/bold]",
        border_style="bright_white",
        box=box.DOUBLE,
    )


def render_footer(errors=None, fred_available=True):
    """Render footer with data source attribution and any errors."""
    content = Text()
    content.append("Data: Yahoo Finance, Federal Reserve (FRED)", style="dim")
    content.append("  |  ", style="dim")
    content.append("Not financial advice.", style="dim italic")

    if not fred_available:
        content.append("\n⚠ FRED API key not set. Macro data unavailable. ", style="yellow dim")
        content.append("Set FRED_API_KEY env var for full dashboard.", style="yellow dim")

    if errors:
        content.append("\n")
        for err in errors:
            content.append(f"\n⚠ {err}", style="red dim")

    return Panel(content, box=box.MINIMAL, style="dim")


def render_dashboard(data, yield_analysis, fed_analysis, sector_analysis, summary, errors=None):
    """Render the full dashboard to the terminal.

    Args:
        data: dict with keys: index_data, yields_data, sector_data, macro_data
        yield_analysis: from analyze_yield_curve()
        fed_analysis: from analyze_fed_impact()
        sector_analysis: from analyze_sector_rotation()
        summary: from generate_market_summary()
        errors: list of error strings
    """
    console = Console()
    console.print()
    console.print(render_header())
    console.print(render_equities(data.get("index_data", {})))
    console.print(render_fixed_income(data.get("yields_data", {}), yield_analysis))
    console.print(render_sectors(data.get("sector_data", {}), sector_analysis))
    console.print(render_macro(data.get("macro_data")))
    console.print(render_fed_policy(fed_analysis))
    console.print(render_market_summary(summary))
    console.print(render_footer(
        errors=errors,
        fred_available=data.get("macro_data") is not None,
    ))
    console.print()
