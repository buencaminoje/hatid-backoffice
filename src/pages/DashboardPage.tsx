import { useEffect, useState } from "react";
import {
    Activity,
    Bike,
    CircleDollarSign,
    Clock3,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { adminApi } from "../api/admin";

interface DashboardData {
    activeRides: number;
    pendingRides: number;
    onlineRiders: number;
    completedRidesToday: number;
    cancelledRidesToday: number;
    ridesToday: number;
    grossSalesToday: number;
    netSalesToday: number;
    platformRevenueToday: number;
    marketingSubsidyToday: number;
    pendingRemittance: number;
    customers: number;
    activeCustomersToday: number;
    riders: number;
    activeRiders: number;
    completionRate: number;
    cancellationRate: number;
}

function formatCurrency(value: number) {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;
}

function formatNumber(value: number) {
    return Number(value || 0).toLocaleString("en-PH");
}

export function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    async function loadDashboard(refresh = false) {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await adminApi.dashboard();

            setData(
                response.data?.data ??
                response.data
            );
        } catch (error: any) {
            setError(
                error.response?.data?.message ??
                "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = [
        {
            label: "Active Rides",
            value: data?.activeRides,
            icon: Activity,
            tone: "blue",
        },
        {
            label: "Pending Rides",
            value: data?.pendingRides,
            icon: Clock3,
            tone: "amber",
        },
        {
            label: "Online Riders",
            value: data?.onlineRiders,
            icon: Bike,
            tone: "purple",
        },
        {
            label: "Completed Today",
            value: data?.completedRidesToday,
            icon: TrendingUp,
            tone: "slate",
        },
    ];

    const onlineRiderRate =
        data?.riders
            ? ((data.onlineRiders ?? 0) / data.riders) * 100
            : 0;

    return (
        <div className="dashboard-page">
            <div className="page-heading dashboard-heading">
                <div>
                    <h1>Dashboard</h1>
                    <p>
                        Monitor Hatid operations, riders, users, and revenue.
                    </p>
                </div>

                <button
                    type="button"
                    className="dashboard-refresh"
                    onClick={() => loadDashboard(true)}
                    disabled={loading || refreshing}
                >
                    <RefreshCw
                        size={15}
                        className={
                            refreshing
                                ? "dashboard-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            <div className="dashboard-stats-grid">
                {stats.map(
                    ({
                        label,
                        value,
                        icon: Icon,
                        tone,
                    }) => (
                        <div
                            className="dashboard-stat-card"
                            key={label}
                        >
                            <div
                                className={`dashboard-stat-icon dashboard-stat-icon-${tone}`}
                            >
                                <Icon size={19} />
                            </div>

                            <div className="dashboard-stat-content">
                                <span>
                                    {label}
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : formatNumber(
                                              value ?? 0
                                          )}
                                </strong>
                            </div>
                        </div>
                    )
                )}
            </div>

            <div className="dashboard-main-grid">
                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Today's Revenue
                            </h2>

                            <p>
                                Financial performance for today.
                            </p>
                        </div>

                        <div className="dashboard-panel-icon">
                            <CircleDollarSign size={19} />
                        </div>
                    </div>

                    <div className="dashboard-revenue-main">
                        <span>
                            Gross Sales
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                      data?.grossSalesToday ??
                                          0
                                  )}
                        </strong>
                    </div>

                    <div className="dashboard-revenue-rows">
                        <div>
                            <span>
                                Marketing Subsidy
                            </span>

                            <strong className="dashboard-negative">
                                -
                                {formatCurrency(
                                    data?.marketingSubsidyToday ??
                                        0
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Net Sales
                            </span>

                            <strong>
                                {formatCurrency(
                                    data?.netSalesToday ??
                                        0
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Platform Revenue
                            </span>

                            <strong>
                                {formatCurrency(
                                    data?.platformRevenueToday ??
                                        0
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Rider Operations
                            </h2>

                            <p>
                                Current rider activity and remittance.
                            </p>
                        </div>

                        <div className="dashboard-panel-icon">
                            <Bike size={19} />
                        </div>
                    </div>

                    <div className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <span>
                                Online Riders
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.onlineRiders ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Total Riders
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.riders ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Active Riders
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.activeRiders ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Pending Remittance
                            </span>

                            <strong className="dashboard-metric-money">
                                {loading
                                    ? "—"
                                    : formatCurrency(
                                          data?.pendingRemittance ??
                                              0
                                      )}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Today's Performance
                            </h2>

                            <p>
                                Ride completion and cancellation metrics.
                            </p>
                        </div>

                        <div className="dashboard-panel-icon">
                            <Activity size={19} />
                        </div>
                    </div>

                    <div className="dashboard-performance">
                        <div className="dashboard-performance-item">
                            <span>
                                Completion Rate
                            </span>

                            <strong className="dashboard-positive">
                                {loading
                                    ? "—"
                                    : `${Number(
    data?.completionRate ??
    0
).toFixed(1)}%`}
                            </strong>
                        </div>

                        <div className="dashboard-performance-item">
                            <span>
                                Cancellation Rate
                            </span>

                            <strong className="dashboard-negative">
                                {loading
                                    ? "—"
                                    : `${Number(
    data?.cancellationRate ??
    0
).toFixed(1)}%`}
                            </strong>
                        </div>

                        <div className="dashboard-performance-item">
                            <span>
                                Rides Today
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.ridesToday ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-performance-item">
                            <span>
                                Cancelled
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.cancelledRidesToday ??
                                              0
                                      )}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Users
                            </h2>

                            <p>
                                Customer and rider population.
                            </p>
                        </div>

                        <div className="dashboard-panel-icon">
                            <Users size={19} />
                        </div>
                    </div>

                    <div className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <span>
                                Customers
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.customers ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Active Today
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.activeCustomersToday ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Riders
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.riders ??
                                              0
                                      )}
                            </strong>
                        </div>

                        <div className="dashboard-metric">
                            <span>
                                Online Now
                            </span>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatNumber(
                                          data?.onlineRiders ??
                                              0
                                      )}
                            </strong>
                        </div>
                    </div>
                </section>
            </div>

            <div className="dashboard-bottom-grid">
                <div className="dashboard-bottom-stat">
                    <div className="dashboard-bottom-icon">
                        <Wallet size={18} />
                    </div>

                    <div className="dashboard-bottom-content">
                        <span>
                            Net Sales Today
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                      data?.netSalesToday ??
                                          0
                                  )}
                        </strong>
                    </div>
                </div>

                <div className="dashboard-bottom-stat">
                    <div className="dashboard-bottom-icon">
                        <TrendingUp size={18} />
                    </div>

                    <div className="dashboard-bottom-content">
                        <span>
                            Platform Revenue
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : formatCurrency(
                                      data?.platformRevenueToday ??
                                          0
                                  )}
                        </strong>
                    </div>
                </div>

                <div className="dashboard-bottom-stat">
                    <div className="dashboard-bottom-icon">
                        <Bike size={18} />
                    </div>

                    <div className="dashboard-bottom-content">
                        <span>
                            Online Rider Rate
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : `${onlineRiderRate.toFixed(
    1
)}%`}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
}