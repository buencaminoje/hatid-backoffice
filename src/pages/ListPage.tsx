import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    DataTable,
} from "../components/DataTable";

export function detailLink(
    basePath: string,
    id: string | undefined | null,
    label = "View"
) {
    if (!id) {
        return "—";
    }

    return (
        <Link
            to={`${basePath}/${id}`}
            className="detail-link"
        >
            {label}
        </Link>
    );
}

export function ListPage({
                             title,
                             description,
                             load,
                             columns,
                             render,
                         }: {
    title: string;
    description: string;
    load: (
        page?: number,
        limit?: number
    ) => Promise<any>;
    columns: string[];
    render: (
        row: any
    ) => React.ReactNode[];
}) {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [total, setTotal] = useState(0);

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    );

    const loadData = useCallback(
        async (
            requestedPage: number,
            requestedLimit: number
        ) => {
            try {
                setLoading(true);
                setError("");

                const response = await load(
                    requestedPage,
                    requestedLimit
                );

                const data =
                    response.data?.data ??
                    response.data;

                if (Array.isArray(data)) {
                    setRows(data);
                    setTotal(data.length);
                    return;
                }

                const records =
                    data?.rides ??
                    data?.items ??
                    data?.customers ??
                    data?.riders ??
                    [];

                setRows(
                    Array.isArray(records)
                        ? records
                        : []
                );

                const responseTotal =
                    data?.total ??
                    data?.totalCount ??
                    data?.count ??
                    data?.pagination?.total ??
                    data?.meta?.total;

                if (
                    typeof responseTotal ===
                    "number"
                ) {
                    setTotal(responseTotal);
                } else {
                    setTotal(
                        Array.isArray(records)
                            ? records.length
                            : 0
                    );
                }
            } catch (error: any) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load records."
                );

                setRows([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        },
        [load]
    );

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            if (cancelled) {
                return;
            }

            await loadData(
                page,
                limit
            );
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        limit,
        loadData,
    ]);

    function handlePageChange(
        nextPage: number
    ) {
        if (
            nextPage < 1 ||
            nextPage > totalPages ||
            nextPage === page
        ) {
            return;
        }

        setPage(nextPage);
    }

    function handleLimitChange(
        value: number
    ) {
        setLimit(value);
        setPage(1);
    }

    function getPageNumbers() {
        const pages: number[] = [];

        if (totalPages <= 7) {
            for (
                let current = 1;
                current <= totalPages;
                current++
            ) {
                pages.push(current);
            }

            return pages;
        }

        pages.push(1);

        if (page > 4) {
            pages.push(-1);
        }

        const start = Math.max(
            2,
            page - 1
        );

        const end = Math.min(
            totalPages - 1,
            page + 1
        );

        for (
            let current = start;
            current <= end;
            current++
        ) {
            pages.push(current);
        }

        if (page < totalPages - 3) {
            pages.push(-1);
        }

        pages.push(totalPages);

        return pages;
    }

    const firstRecord =
        total === 0
            ? 0
            : (page - 1) * limit + 1;

    const lastRecord =
        Math.min(
            page * limit,
            total
        );

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>{title}</h1>

                    <p>
                        {description}
                    </p>
                </div>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="panel loading-state">
                    <div className="loading-content">
                        <span className="loading-spinner"/>

                        <span>
                            Loading...
                        </span>
                    </div>
                </div>
            ) : (
                <div className="panel">
                    <DataTable
                        columns={columns}
                        rows={rows}
                        render={render}
                    />

                    <div className="pagination">
                        <div className="pagination-info">
                            <span>
                                {total > 0
                                    ? `Showing ${firstRecord}–${lastRecord} of ${total}`
                                    : "No records"}
                            </span>

                            <label>
                                <span>
                                    Per page
                                </span>

                                <select
                                    value={limit}
                                    onChange={event =>
                                        handleLimitChange(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                >
                                    <option value={10}>
                                        10
                                    </option>

                                    <option value={25}>
                                        25
                                    </option>

                                    <option value={50}>
                                        50
                                    </option>

                                    <option value={100}>
                                        100
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="pagination-nav"
                                disabled={
                                    page <= 1 ||
                                    loading
                                }
                                onClick={() =>
                                    handlePageChange(
                                        page - 1
                                    )
                                }
                            >
                                ‹ Previous
                            </button>

                            {getPageNumbers().map(
                                (
                                    pageNumber,
                                    index
                                ) =>
                                    pageNumber ===
                                    -1 ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="pagination-ellipsis"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={
                                                pageNumber
                                            }
                                            type="button"
                                            className={
                                                pageNumber ===
                                                page
                                                    ? "active"
                                                    : ""
                                            }
                                            disabled={
                                                loading
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    pageNumber
                                                )
                                            }
                                        >
                                            {
                                                pageNumber
                                            }
                                        </button>
                                    )
                            )}

                            <button
                                type="button"
                                className="pagination-nav"
                                disabled={
                                    page >=
                                    totalPages ||
                                    loading
                                }
                                onClick={() =>
                                    handlePageChange(
                                        page + 1
                                    )
                                }
                            >
                                Next ›
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}