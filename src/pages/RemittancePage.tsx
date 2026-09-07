import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowRight,
    RefreshCw,
    Search,
    Wallet,
} from "lucide-react";

import {
    adminApi,
    RiderRemittance,
} from "../api/admin";

function getRiderId(rider: RiderRemittance) {
    return (
        rider.profileId ??
        rider.profile_id ??
        rider.id ??
        ""
    );
}

function getNickname(rider: RiderRemittance) {
    const nickname = rider.nickname?.trim();

    return nickname || "Unnamed Rider";
}

function getMobileNumber(rider: RiderRemittance) {
    return (
        rider.mobileNumber ??
        rider.mobile_number ??
        "—"
    );
}

function getWalletBalance(rider: RiderRemittance) {
    const value =
        rider.walletBalance ??
        rider.wallet_balance ??
        0;

    const balance = Number(value);

    return Number.isFinite(balance)
        ? balance
        : 0;
}

function getRemittanceAmount(rider: RiderRemittance) {
    const value =
        rider.remittanceAmount ??
        rider.remittance_amount;

    if (
        value !== undefined &&
        value !== null
    ) {
        const amount = Number(value);

        if (Number.isFinite(amount)) {
            return Math.abs(amount);
        }
    }

    return Math.abs(
        getWalletBalance(rider)
    );
}

function formatCurrency(value: number) {
    return `₱${Math.abs(value).toLocaleString(
    "en-PH",
    {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }
)}`;
}

function getInitials(nickname: string) {
    return nickname
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part =>
            part.charAt(0)
        )
        .join("")
        .toUpperCase();
}

export function RemittancePage() {
    const [riders, setRiders] =
        useState<RiderRemittance[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [error, setError] =
        useState("");

    async function loadRemittances(
        refresh = false
    ) {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response =
                await adminApi.riderRemittanceStatus(
                    1,
                    100
                );

            const payload =
                response.data?.data;

            const records =
                Array.isArray(payload)
                    ? payload
                    : payload?.riders ?? [];

            setRiders(records);
        } catch (error: any) {
            setError(
                error.response?.data?.message ??
                "Unable to load pending remittances."
            );

            setRiders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadRemittances();
    }, []);

    const filteredRiders =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            const result = [
                ...riders,
            ].sort(
                (a, b) =>
                    getRemittanceAmount(b) -
                    getRemittanceAmount(a)
            );

            if (!query) {
                return result;
            }

            return result.filter(
                rider => {
                    const values = [
                        getNickname(rider),
                        getMobileNumber(rider),
                        getRiderId(rider),
                    ];

                    return values.some(
                        value =>
                            String(value)
                                .toLowerCase()
                                .includes(query)
                    );
                }
            );
        }, [
            riders,
            search,
        ]);

    const totalPending =
        useMemo(
            () =>
                riders.reduce(
                    (sum, rider) =>
                        sum +
                        getRemittanceAmount(
                            rider
                        ),
                    0
                ),
            [riders]
        );

    return (
        <div>
            <div className="page-heading">
                <div>
                    <h1>
                        Pending Remittance
                    </h1>

                    <p>
                        Review and track outstanding
                        rider remittances.
                    </p>
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                        loadRemittances(true)
                    }
                    disabled={
                        loading ||
                        refreshing
                    }
                >
                    <RefreshCw
                        size={15}
                        className={
                            refreshing
                                ? "remittance-spin"
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

            <div className="remittance-overview">
                <div className="remittance-overview-item">
                    <span>
                        Total Pending
                    </span>

                    <strong>
                        {formatCurrency(
                            totalPending
                        )}
                    </strong>
                </div>

                <div className="remittance-overview-item">
                    <span>
                        Outstanding Riders
                    </span>

                    <strong>
                        {riders.length}
                    </strong>
                </div>

                <div className="remittance-overview-item">
                    <span>
                        Showing
                    </span>

                    <strong>
                        {filteredRiders.length}
                    </strong>
                </div>
            </div>

            <div className="panel">
                <div className="remittance-toolbar">
                    <div>
                        <strong>
                            Rider Remittances
                        </strong>

                        <span>
                            Outstanding balances requiring
                            attention
                        </span>
                    </div>

                    <div className="remittance-search">
                        <Search size={16} />

                        <input
                            type="text"
                            value={search}
                            onChange={event =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search rider..."
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        Loading pending remittances...
                    </div>
                ) : filteredRiders.length === 0 ? (
                    <div className="empty-state remittance-empty-state">
                        <Wallet size={24} />

                        <strong>
                            {search
                                ? "No riders found"
                                : "No pending remittances"}
                        </strong>

                        <span>
                            {search
                                ? "Try a different search."
                                : "All rider remittances are currently settled."}
                        </span>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="remittance-table">
                            <thead>
                                <tr>
                                    <th>
                                        Rider
                                    </th>

                                    <th>
                                        Mobile
                                    </th>

                                    <th>
                                        Wallet Balance
                                    </th>

                                    <th className="remittance-due-header">
                                        Amount Due
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {filteredRiders.map(
                                    rider => {
                                        const riderId =
                                            getRiderId(
                                                rider
                                            );

                                        const nickname =
                                            getNickname(
                                                rider
                                            );

                                        const balance =
                                            getWalletBalance(
                                                rider
                                            );

                                        const amount =
                                            getRemittanceAmount(
                                                rider
                                            );

                                        return (
                                            <tr
                                                key={
                                                    riderId ||
                                                    nickname
                                                }
                                            >
                                                <td>
                                                    <div className="remittance-rider">
                                                        <div className="remittance-avatar">
                                                            {getInitials(
                                                                nickname
                                                            )}
                                                        </div>

                                                        <div className="remittance-rider-info">
                                                            <strong>
                                                                {nickname}
                                                            </strong>

                                                            <span>
                                                                {riderId
                                                                    ? riderId.slice(
                                                                        0,
                                                                        8
                                                                    )
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    {getMobileNumber(
                                                        rider
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="remittance-balance-negative">
                                                        -{formatCurrency(
                                                            balance
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="remittance-due">
                                                    <strong>
                                                        {formatCurrency(
                                                            amount
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="status status-pending">
                                                        Outstanding
                                                    </span>
                                                </td>

                                                <td>
                                                    {riderId && (
                                                        <a
                                                            href={`/riders/${riderId}`}
                                                            className="detail-link remittance-view-link"
                                                        >
                                                            View
                                                            <ArrowRight
                                                                size={14}
                                                            />
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}