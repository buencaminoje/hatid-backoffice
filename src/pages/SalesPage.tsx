import {useEffect, useMemo, useState} from "react";
import {
    Activity,
    Banknote,
    CalendarDays,
    CreditCard,
    PhilippinePeso,
    Tag,
    TrendingUp
} from "lucide-react";
import {adminApi, SalesRide} from "../api/admin";

const formatCurrency = (value: number) =>
    `₱${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
};

const getDateRange = (range: string) => {
    if (range === "all") {
        return {
            from: null,
            to: null
        };
    }

    const now = new Date();
    const from = new Date(now);

    from.setDate(
        from.getDate() - Number(range)
    );

    return {
        from: from.toISOString(),
        to: now.toISOString()
    };
};

export function SalesPage() {
    const [rides, setRides] = useState<SalesRide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dateRange, setDateRange] = useState("30");
    const [paymentMethod, setPaymentMethod] = useState("all");
    const [serviceType, setServiceType] = useState("all");

    useEffect(() => {
        void loadSales();
    }, [
        dateRange,
        paymentMethod,
        serviceType
    ]);

    async function loadSales() {
        try {
            setLoading(true);
            setError("");

            const range = getDateRange(dateRange);

            const response = await adminApi.sales(
                range.from,
                range.to,
                paymentMethod === "all"
                    ? null
                    : paymentMethod,
                serviceType === "all"
                    ? null
                    : serviceType,
                50,
                0
            );

            const data = response.data?.data;

            setRides(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (e: any) {
            setRides([]);
            setError(
                e.response?.data?.message ??
                e.response?.data?.error ??
                "Unable to load sales data."
            );
        } finally {
            setLoading(false);
        }
    }

    const metrics = useMemo(() => {
        let grossSales = 0;
        let netSales = 0;
        let marketingSubsidy = 0;
        let platformRevenue = 0;

        for (const ride of rides) {
            grossSales += Number(
                ride.gross_sale || 0
            );

            netSales += Number(
                ride.net_sale || 0
            );

            marketingSubsidy += Number(
                ride.marketing_subsidy || 0
            );

            platformRevenue += Number(
                ride.platform_fee || 0
            );
        }

        return {
            grossSales,
            netSales,
            marketingSubsidy,
            platformRevenue,
            completedRides: rides.length,
            averageNetSale:
                rides.length > 0
                    ? netSales / rides.length
                    : 0
        };
    }, [rides]);

    const dailySales = useMemo(() => {
        const result: Record<
            string,
            {
                gross: number;
                net: number;
            }
        > = {};

        for (const ride of rides) {
            if (!ride.completed_at) continue;

            const date = new Date(
                ride.completed_at
            );

            if (Number.isNaN(date.getTime())) {
                continue;
            }

            const key = date
                .toISOString()
                .slice(0, 10);

            if (!result[key]) {
                result[key] = {
                    gross: 0,
                    net: 0
                };
            }

            result[key].gross += Number(
                ride.gross_sale || 0
            );

            result[key].net += Number(
                ride.net_sale || 0
            );
        }

        return Object.entries(result)
            .sort((a, b) =>
                a[0].localeCompare(b[0])
            )
            .slice(-14);
    }, [rides]);

    const paymentSummary = useMemo(() => {
        const result: Record<string, number> = {};

        for (const ride of rides) {
            const method =
                ride.payment_method ||
                "Unknown";

            result[method] =
                (result[method] ?? 0) +
                Number(ride.net_sale || 0);
        }

        return Object.entries(result)
            .sort((a, b) => b[1] - a[1]);
    }, [rides]);

    const serviceSummary = useMemo(() => {
        const result: Record<string, number> = {};

        for (const ride of rides) {
            const service =
                ride.type || "Unknown";

            result[service] =
                (result[service] ?? 0) +
                Number(ride.net_sale || 0);
        }

        return Object.entries(result)
            .sort((a, b) => b[1] - a[1]);
    }, [rides]);

    const maxDailySales = Math.max(
        ...dailySales.map(
            ([, value]) => value.gross
        ),
        1
    );

    const stats = [
        {
            label: "Net Sales",
            value: formatCurrency(
                metrics.netSales
            ),
            icon: PhilippinePeso
        },
        {
            label: "Completed Rides",
            value:
                metrics.completedRides.toLocaleString(),
            icon: Activity
        },
        {
            label: "Average Net Sale",
            value: formatCurrency(
                metrics.averageNetSale
            ),
            icon: TrendingUp
        },
        {
            label: "Platform Revenue",
            value: formatCurrency(
                metrics.platformRevenue
            ),
            icon: Tag
        }
    ];

    return (
        <div className="sales-page">
            <div className="page-heading">
                <div>
                    <h1>Sales</h1>
                    <p>
                        Monitor completed ride revenue
                        and sales performance.
                    </p>
                </div>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            <section className="sales-toolbar">
                <div className="sales-toolbar-label">
                    <CalendarDays size={17}/>
                    <span>Filters</span>
                </div>

                <div className="sales-select">
                    <span>Period</span>
                    <select
                        value={dateRange}
                        onChange={event =>
                            setDateRange(
                                event.target.value
                            )
                        }
                    >
                        <option value="7">
                            Last 7 days
                        </option>
                        <option value="30">
                            Last 30 days
                        </option>
                        <option value="90">
                            Last 90 days
                        </option>
                        <option value="365">
                            Last 12 months
                        </option>
                        <option value="all">
                            All time
                        </option>
                    </select>
                </div>

                <div className="sales-select">
                    <span>Payment</span>
                    <select
                        value={paymentMethod}
                        onChange={event =>
                            setPaymentMethod(
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            All payments
                        </option>
                        <option value="Cash">
                            Cash
                        </option>
                        <option value="GCash">
                            GCash
                        </option>
                        <option value="Wallet">
                            Wallet
                        </option>
                    </select>
                </div>

                <div className="sales-select">
                    <span>Service</span>
                    <select
                        value={serviceType}
                        onChange={event =>
                            setServiceType(
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            All services
                        </option>
                        <option value="Ride">
                            Ride
                        </option>
                        <option value="Delivery">
                            Delivery
                        </option>
                    </select>
                </div>
            </section>

            <div className="stats-grid sales-stats">
                {stats.map(
                    ({
                         label,
                         value,
                         icon: Icon
                     }) => (
                        <div
                            className="stat-card"
                            key={label}
                        >
                            <div>
                                <span>{label}</span>
                                <strong>
                                    {loading
                                        ? "—"
                                        : value}
                                </strong>
                            </div>
                            <Icon size={22}/>
                        </div>
                    )
                )}
            </div>

            <section className="panel sales-main-panel">
                <div className="sales-panel-header">
                    <div>
                        <h2>Revenue</h2>
                        <p>
                            Gross and net completed
                            sales for the selected period.
                        </p>
                    </div>

                    <div className="sales-header-total">
                        <span>Net Sales</span>
                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                    metrics.netSales
                                )}
                        </strong>
                        <small>
                            {loading
                                ? "—"
                                : `${metrics.completedRides.toLocaleString()} completed rides`}
                        </small>
                    </div>
                </div>

                {loading ? (
                    <div className="sales-chart-empty">
                        Loading revenue data...
                    </div>
                ) : dailySales.length === 0 ? (
                    <div className="sales-chart-empty">
                        No sales found for the selected
                        period.
                    </div>
                ) : (
                    <div className="sales-chart">
                        <div className="sales-chart-y">
                            <span>
                                {formatCurrency(
                                    maxDailySales
                                )}
                            </span>
                            <span>
                                {formatCurrency(
                                    maxDailySales / 2
                                )}
                            </span>
                            <span>₱0.00</span>
                        </div>

                        <div className="sales-chart-body">
                            <div className="sales-chart-grid">
                                <span/>
                                <span/>
                                <span/>
                            </div>

                            <div className="sales-chart-bars">
                                {dailySales.map(
                                    ([date, value]) => {
                                        const height =
                                            Math.max(
                                                (
                                                    value.gross /
                                                    maxDailySales
                                                ) * 100,
                                                3
                                            );

                                        return (
                                            <div
                                                className="sales-chart-item"
                                                key={date}
                                            >
                                                <div className="sales-chart-bar-area">
                                                    <div
                                                        className="sales-chart-bar"
                                                        style={{
                                                            height:
                                                                `${height}%`
                                                        }}
                                                        title={
                                                            `${date}: ` +
                                                            `${formatCurrency(value.gross)} gross / ` +
                                                            `${formatCurrency(value.net)} net`
                                                        }
                                                    />
                                                </div>

                                                <span>
                                                    {new Date(
                                                        `${date}T00:00:00`
                                                    ).toLocaleDateString(
                                                        "en-PH",
                                                        {
                                                            month: "short",
                                                            day: "numeric"
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className="sales-analysis-grid">
                <section className="panel sales-analysis-panel">
                    <div className="sales-panel-header">
                        <div>
                            <h2>
                                Payment methods
                            </h2>
                            <p>
                                Net sales distribution
                                by payment method.
                            </p>
                        </div>
                    </div>

                    {paymentSummary.length === 0 ? (
                        <div className="sales-analysis-empty">
                            No payment data.
                        </div>
                    ) : (
                        <div className="sales-breakdown">
                            {paymentSummary.map(
                                ([method, value]) => {
                                    const percentage =
                                        metrics.netSales > 0
                                            ? (
                                            value /
                                            metrics.netSales
                                        ) * 100
                                            : 0;

                                    return (
                                        <div
                                            className="sales-breakdown-row"
                                            key={method}
                                        >
                                            <div className="sales-breakdown-info">
                                                <strong>
                                                    {method}
                                                </strong>
                                                <span>
                                                    {percentage.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </span>
                                            </div>

                                            <div className="sales-breakdown-track">
                                                <div
                                                    style={{
                                                        width:
                                                            `${percentage}%`
                                                    }}
                                                />
                                            </div>

                                            <strong className="sales-breakdown-value">
                                                {formatCurrency(
                                                    value
                                                )}
                                            </strong>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                <section className="panel sales-analysis-panel">
                    <div className="sales-panel-header">
                        <div>
                            <h2>Services</h2>
                            <p>
                                Net sales by service
                                type.
                            </p>
                        </div>
                    </div>

                    {serviceSummary.length === 0 ? (
                        <div className="sales-analysis-empty">
                            No service data.
                        </div>
                    ) : (
                        <div className="sales-service-list">
                            {serviceSummary.map(
                                ([service, value]) => (
                                    <div
                                        className="sales-service-row"
                                        key={service}
                                    >
                                        <div className="sales-service-icon">
                                            <Banknote
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <strong>
                                                {service}
                                            </strong>
                                            <span>
                                                Net sales
                                            </span>
                                        </div>

                                        <strong>
                                            {formatCurrency(
                                                value
                                            )}
                                        </strong>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>

            <section className="panel sales-financial-panel">

                <div className="sales-panel-header">
                    <div>
                        <h2>
                            Financial summary
                        </h2>
                        <p>
                            Breakdown of completed
                            sales and platform earnings.
                        </p>
                    </div>
                </div>

                <div className="sales-financial-grid">
                    <div>
                        <span>Gross Sales</span>
                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                    metrics.grossSales
                                )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Marketing Subsidy
                        </span>
                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                    metrics.marketingSubsidy
                                )}
                        </strong>
                    </div>

                    <div>
                        <span>Net Sales</span>
                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                    metrics.netSales
                                )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Platform Revenue
                        </span>
                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                    metrics.platformRevenue
                                )}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="panel sales-table-panel">
                <div className="sales-panel-header">
                    <div>
                        <h2>Recent sales</h2>
                        <p>
                            Completed rides included
                            in the current filters.
                        </p>
                    </div>

                    <div className="sales-table-count">
                        {rides.length} rides
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Ride ID</th>
                            <th>Service</th>
                            <th>Category</th>
                            <th>Payment</th>
                            <th>Gross Sale</th>
                            <th>Subsidy</th>
                            <th>Net Sale</th>
                            <th>Platform Fee</th>
                            <th>Completed</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="sales-table-empty"
                                >
                                    Loading sales...
                                </td>
                            </tr>
                        ) : rides.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="sales-table-empty"
                                >
                                    No completed rides
                                    found.
                                </td>
                            </tr>
                        ) : (
                            rides.map(ride => (
                                <tr
                                    key={ride.ride_id}
                                >
                                    <td>
                                        <span className="ride-id">
                                            {ride.ride_id?.slice(
                                                0,
                                                8
                                            ) ?? "—"}
                                        </span>
                                    </td>

                                    <td>
                                        {ride.type ?? "—"}
                                    </td>

                                    <td>
                                        {ride.category ?? "—"}
                                    </td>

                                    <td>
                                        <span className="sales-payment">
                                            <CreditCard
                                                size={14}
                                            />
                                            {ride.payment_method ??
                                                "—"}
                                        </span>
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            Number(
                                                ride.gross_sale ||
                                                0
                                            )
                                        )}
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            Number(
                                                ride.marketing_subsidy ||
                                                0
                                            )
                                        )}
                                    </td>

                                    <td>
                                        <strong>
                                            {formatCurrency(
                                                Number(
                                                    ride.net_sale ||
                                                    0
                                                )
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            Number(
                                                ride.platform_fee ||
                                                0
                                            )
                                        )}
                                    </td>

                                    <td>
                                        {formatDate(
                                            ride.completed_at
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}