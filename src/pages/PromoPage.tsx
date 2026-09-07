import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Plus,
    Search,
    X,
} from "lucide-react";
import { adminApi } from "../api/admin";

type Promo = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount?: number | null;
    min_fare?: number | null;
    max_fare?: number | null;
    service_types: string[];
    start_at: string;
    end_at: string;
    usage_limit?: number | null;
    usage_limit_per_user?: number | null;
    used_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type PromoForm = {
    code: string;
    name: string;
    description: string;
    discount_type: "percentage" | "fixed";
    discount_value: string;
    max_discount: string;
    min_fare: string;
    max_fare: string;
    service_types: string[];
    start_at: string;
    end_at: string;
    usage_limit: string;
    usage_limit_per_user: string;
    is_active: boolean;
};

const emptyForm: PromoForm = {
    code: "",
    name: "",
    description: "",
    discount_type: "fixed",
    discount_value: "",
    max_discount: "",
    min_fare: "",
    max_fare: "",
    service_types: ["Ride", "Delivery"],
    start_at: "",
    end_at: "",
    usage_limit: "",
    usage_limit_per_user: "",
    is_active: true,
};

function toDateTimeLocal(value?: string | null) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (value: number) =>
        String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

function toIso(value: string) {
    return new Date(value).toISOString();
}

function formatMoney(value?: number | null) {
    if (value == null) {
        return "—";
    }

    return `₱${Number(value).toFixed(2)}`;
}

function formatDate(value?: string | null) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString();
}

function getPromoStatus(promo: Promo) {
    const now = Date.now();
    const start = new Date(promo.start_at).getTime();
    const end = new Date(promo.end_at).getTime();

    if (!promo.is_active) {
        return "inactive";
    }

    if (now < start) {
        return "scheduled";
    }

    if (now > end) {
        return "expired";
    }

    if (
        promo.usage_limit != null &&
        promo.used_count >= promo.usage_limit
    ) {
        return "exhausted";
    }

    return "active";
}

export function PromoPage() {
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] =
        useState<Promo | null>(null);

    const [form, setForm] =
        useState<PromoForm>(emptyForm);

    async function loadPromos() {
        try {
            setLoading(true);
            setError("");

            const response = await adminApi.promos();

            const data =
                response.data?.data ??
                response.data;

            setPromos(
                Array.isArray(data)
                    ? data
                    : data?.items ?? []
            );
        } catch (error: any) {
            setError(
                error.response?.data?.message ??
                "Unable to load promos."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPromos();
    }, []);

    const filteredPromos = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return promos;
        }

        return promos.filter((promo) =>
            [
                promo.code,
                promo.name,
                promo.description,
                promo.discount_type,
                ...(promo.service_types ?? []),
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                )
        );
    }, [promos, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredPromos.length / pageSize
        )
    );

    const visiblePromos = filteredPromos.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    function openCreate() {
        setEditingPromo(null);
        setForm({
            ...emptyForm,
            start_at: toDateTimeLocal(
                new Date().toISOString()
            ),
            end_at: toDateTimeLocal(
                new Date(
                    Date.now() +
                    7 * 24 * 60 * 60 * 1000
                ).toISOString()
            ),
        });
        setError("");
        setModalOpen(true);
    }

    function openEdit(promo: Promo) {
        setEditingPromo(promo);

        setForm({
            code: promo.code,
            name: promo.name,
            description:
                promo.description ?? "",
            discount_type:
            promo.discount_type,
            discount_value:
                String(promo.discount_value),
            max_discount:
                promo.max_discount == null
                    ? ""
                    : String(promo.max_discount),
            min_fare:
                promo.min_fare == null
                    ? ""
                    : String(promo.min_fare),
            max_fare:
                promo.max_fare == null
                    ? ""
                    : String(promo.max_fare),
            service_types:
                promo.service_types ?? [],
            start_at:
                toDateTimeLocal(
                    promo.start_at
                ),
            end_at:
                toDateTimeLocal(
                    promo.end_at
                ),
            usage_limit:
                promo.usage_limit == null
                    ? ""
                    : String(promo.usage_limit),
            usage_limit_per_user:
                promo.usage_limit_per_user ==
                null
                    ? ""
                    : String(
                        promo.usage_limit_per_user
                    ),
            is_active:
            promo.is_active,
        });

        setError("");
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingPromo(null);
        setForm(emptyForm);
    }

    function updateForm(
        key: keyof PromoForm,
        value: string | boolean | string[]
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function toggleServiceType(
        serviceType: string
    ) {
        setForm((current) => {
            const exists =
                current.service_types.includes(
                    serviceType
                );

            return {
                ...current,
                service_types: exists
                    ? current.service_types.filter(
                        (item) =>
                            item !==
                            serviceType
                    )
                    : [
                        ...current.service_types,
                        serviceType,
                    ],
            };
        });
    }

    async function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();

        if (form.service_types.length === 0) {
            setError(
                "Select at least one service type."
            );
            return;
        }

        if (
            !form.start_at ||
            !form.end_at
        ) {
            setError(
                "Start and end dates are required."
            );
            return;
        }

        if (
            new Date(form.end_at) <=
            new Date(form.start_at)
        ) {
            setError(
                "End date must be after start date."
            );
            return;
        }

        if (
            form.discount_type ===
            "percentage" &&
            Number(form.discount_value) > 100
        ) {
            setError(
                "Percentage discount cannot exceed 100%."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                description:
                    form.description.trim() ||
                    null,
                discount_type:
                form.discount_type,
                discount_value:
                    Number(form.discount_value),
                max_discount:
                    form.max_discount
                        ? Number(
                            form.max_discount
                        )
                        : null,
                min_fare:
                    form.min_fare
                        ? Number(form.min_fare)
                        : null,
                max_fare:
                    form.max_fare
                        ? Number(form.max_fare)
                        : null,
                service_types:
                form.service_types,
                start_at: toIso(
                    form.start_at
                ),
                end_at: toIso(
                    form.end_at
                ),
                usage_limit:
                    form.usage_limit
                        ? Number(
                            form.usage_limit
                        )
                        : null,
                usage_limit_per_user:
                    form.usage_limit_per_user
                        ? Number(
                            form.usage_limit_per_user
                        )
                        : null,
                is_active:
                form.is_active,
            };

            if (editingPromo) {
                await adminApi.updatePromo(
                    editingPromo.id,
                    payload
                );
            } else {
                await adminApi.createPromo(
                    payload
                );
            }

            closeModal();
            await loadPromos();
        } catch (error: any) {
            setError(
                error.response?.data?.message ??
                "Unable to save promo."
            );
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(
        promo: Promo
    ) {
        try {
            setError("");

            await adminApi.updatePromo(
                promo.id,
                {
                    is_active:
                        !promo.is_active,
                }
            );

            await loadPromos();
        } catch (error: any) {
            setError(
                error.response?.data?.message ??
                "Unable to update promo."
            );
        }
    }

    function renderDiscount(
        promo: Promo
    ) {
        if (
            promo.discount_type ===
            "percentage"
        ) {
            return `${Number(
                promo.discount_value
            )}%`;
        }

        return formatMoney(
            promo.discount_value
        );
    }

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Promos</h1>
                    <p>
                        Create and manage promotional
                        discounts.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={openCreate}
                >
                    <Plus size={17} />
                    Create Promo
                </button>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            <div className="panel">
                <div className="table-toolbar">
                    <div className="search-box">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(
                                    event.target
                                        .value
                                );
                                setPage(1);
                            }}
                            placeholder="Search promos..."
                        />
                    </div>

                    <span className="table-count">
                        {filteredPromos.length} promo
                        {filteredPromos.length ===
                        1
                            ? ""
                            : "s"}
                    </span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-content">
                            <span className="loading-spinner" />
                            <span>
                                Loading promos...
                            </span>
                        </div>
                    </div>
                ) : visiblePromos.length ===
                0 ? (
                    <div className="empty-state">
                        <strong>
                            No promos found
                        </strong>
                        <span>
                            Create a promo to get
                            started.
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="promo-table-wrapper">
                            <table className="promo-table">
                                <thead>
                                <tr>
                                    <th>
                                        Promo
                                    </th>
                                    <th>
                                        Discount
                                    </th>
                                    <th>
                                        Services
                                    </th>
                                    <th>
                                        Validity
                                    </th>
                                    <th>
                                        Usage
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                    <th>
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {visiblePromos.map(
                                    (
                                        promo
                                    ) => {
                                        const status =
                                            getPromoStatus(
                                                promo
                                            );

                                        return (
                                            <tr
                                                key={
                                                    promo.id
                                                }
                                            >
                                                <td>
                                                    <div className="promo-main">
                                                        <strong>
                                                            {
                                                                promo.code
                                                            }
                                                        </strong>
                                                        <span>
                                                                {
                                                                    promo.name
                                                                }
                                                            </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="promo-discount">
                                                        <strong>
                                                            {renderDiscount(
                                                                promo
                                                            )}
                                                        </strong>

                                                        {promo.max_discount !=
                                                            null &&
                                                            promo.discount_type ===
                                                            "percentage" && (
                                                                <span>
                                                                        Max{" "}
                                                                    {formatMoney(
                                                                        promo.max_discount
                                                                    )}
                                                                    </span>
                                                            )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="promo-services">
                                                        {promo.service_types?.map(
                                                            (
                                                                service
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        service
                                                                    }
                                                                >
                                                                        {
                                                                            service
                                                                        }
                                                                    </span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="promo-dates">
                                                            <span>
                                                                {formatDate(
                                                                    promo.start_at
                                                                )}
                                                            </span>
                                                        <span>
                                                                to
                                                            </span>
                                                        <span>
                                                                {formatDate(
                                                                    promo.end_at
                                                                )}
                                                            </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {promo.used_count}
                                                    {promo.usage_limit !=
                                                    null
                                                        ? ` / ${promo.usage_limit}`
                                                        : ""}
                                                </td>

                                                <td>
                                                        <span
                                                            className={`status status-${status}`}
                                                        >
                                                            {
                                                                status
                                                            }
                                                        </span>
                                                </td>

                                                <td>
                                                    <div className="promo-actions">
                                                        <button
                                                            type="button"
                                                            className="icon-button"
                                                            title="Edit promo"
                                                            onClick={() =>
                                                                openEdit(
                                                                    promo
                                                                )
                                                            }
                                                        >
                                                            <Edit3
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="icon-button"
                                                            title={
                                                                promo.is_active
                                                                    ? "Deactivate promo"
                                                                    : "Activate promo"
                                                            }
                                                            onClick={() =>
                                                                toggleActive(
                                                                    promo
                                                                )
                                                            }
                                                        >
                                                            {promo.is_active ? (
                                                                <X
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            ) : (
                                                                <Check
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages >
                            1 && (
                                <div className="pagination">
                                    <button
                                        type="button"
                                        disabled={
                                            page <= 1
                                        }
                                        onClick={() =>
                                            setPage(
                                                (value) =>
                                                    Math.max(
                                                        1,
                                                        value -
                                                        1
                                                    )
                                            )
                                        }
                                    >
                                        <ChevronLeft
                                            size={
                                                16
                                            }
                                        />
                                    </button>

                                    <span>
                                    Page{" "}
                                        {page} of{" "}
                                        {
                                            totalPages
                                        }
                                </span>

                                    <button
                                        type="button"
                                        disabled={
                                            page >=
                                            totalPages
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    value
                                                ) =>
                                                    Math.min(
                                                        totalPages,
                                                        value +
                                                        1
                                                    )
                                            )
                                        }
                                    >
                                        <ChevronRight
                                            size={
                                                16
                                            }
                                        />
                                    </button>
                                </div>
                            )}
                    </>
                )}
            </div>

            {modalOpen && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="modal promo-modal">
                        <div className="modal-header">
                            <div>
                                <h2>
                                    {editingPromo
                                        ? "Edit Promo"
                                        : "Create Promo"}
                                </h2>
                                <p>
                                    Configure the
                                    promotional
                                    discount and
                                    eligibility.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="icon-button"
                                onClick={
                                    closeModal
                                }
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <div className="form-grid">
                                <label>
                                    <span>
                                        Promo Code
                                    </span>
                                    <input
                                        required
                                        maxLength={
                                            20
                                        }
                                        value={
                                            form.code
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "code",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="WELCOME50"
                                    />
                                </label>

                                <label>
                                    <span>
                                        Name
                                    </span>
                                    <input
                                        required
                                        value={
                                            form.name
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "name",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Welcome Promo"
                                    />
                                </label>

                                <label className="form-full">
                                    <span>
                                        Description
                                    </span>
                                    <textarea
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "description",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={3}
                                        placeholder="Optional description"
                                    />
                                </label>

                                <label>
                                    <span>
                                        Discount
                                        Type
                                    </span>
                                    <select
                                        value={
                                            form.discount_type
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "discount_type",
                                                event
                                                    .target
                                                    .value as
                                                    | "percentage"
                                                    | "fixed"
                                            )
                                        }
                                    >
                                        <option value="fixed">
                                            Fixed Amount
                                        </option>
                                        <option value="percentage">
                                            Percentage
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span>
                                        Discount
                                        Value
                                    </span>
                                    <input
                                        required
                                        min="0"
                                        max={
                                            form.discount_type ===
                                            "percentage"
                                                ? 100
                                                : undefined
                                        }
                                        step="0.01"
                                        type="number"
                                        value={
                                            form.discount_value
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "discount_value",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    <span>
                                        Max Discount
                                    </span>
                                    <input
                                        min="0"
                                        step="0.01"
                                        type="number"
                                        value={
                                            form.max_discount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "max_discount",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Optional"
                                    />
                                </label>

                                <label>
                                    <span>
                                        Minimum Fare
                                    </span>
                                    <input
                                        min="0"
                                        step="0.01"
                                        type="number"
                                        value={
                                            form.min_fare
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "min_fare",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Optional"
                                    />
                                </label>

                                <label>
                                    <span>
                                        Maximum Fare
                                    </span>
                                    <input
                                        min="0"
                                        step="0.01"
                                        type="number"
                                        value={
                                            form.max_fare
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "max_fare",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Optional"
                                    />
                                </label>

                                <div className="form-full">
                                    <span className="form-label">
                                        Service Types
                                    </span>

                                    <div className="service-checkboxes">
                                        {[
                                            "Ride",
                                            "Delivery",
                                        ].map(
                                            (
                                                service
                                            ) => (
                                                <label
                                                    key={
                                                        service
                                                    }
                                                    className="checkbox-option"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={form.service_types.includes(
                                                            service
                                                        )}
                                                        onChange={() =>
                                                            toggleServiceType(
                                                                service
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        {
                                                            service
                                                        }
                                                    </span>
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>

                                <label>
                                    <span>
                                        Start
                                    </span>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={
                                            form.start_at
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "start_at",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    <span>
                                        End
                                    </span>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={
                                            form.end_at
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "end_at",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    <span>
                                        Usage Limit
                                    </span>
                                    <input
                                        min="1"
                                        type="number"
                                        value={
                                            form.usage_limit
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "usage_limit",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Unlimited"
                                    />
                                </label>

                                <label>
                                    <span>
                                        Usage Limit
                                        Per User
                                    </span>
                                    <input
                                        min="1"
                                        type="number"
                                        value={
                                            form.usage_limit_per_user
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "usage_limit_per_user",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Unlimited"
                                    />
                                </label>

                                <label className="checkbox-option form-full">
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.is_active
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "is_active",
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />
                                    <span>
                                        Promo is
                                        active
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="error-box">
                                    {error}
                                </div>
                            )}

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingPromo
                                            ? "Save Changes"
                                            : "Create Promo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}