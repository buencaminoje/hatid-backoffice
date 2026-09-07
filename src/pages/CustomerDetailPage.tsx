import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {adminApi} from "../api/admin";
import {detailLink} from "./ListPage";

function DetailRow({
                       label,
                       value
                   }: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="detail-row">
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
        </div>
    );
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString();
}

function formatCurrency(
    value: number | null | undefined
) {
    if (value == null) {
        return "—";
    }

    return `₱${Number(value).toFixed(2)}`;
}

function getInitials(
    firstName?: string | null,
    lastName?: string | null,
    fullName?: string | null
) {
    if (firstName || lastName) {
        return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
    }

    if (fullName) {
        return fullName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                (name: string) => name[0]
            )
            .join("")
            .toUpperCase();
    }

    return "?";
}

export function CustomerDetailPage() {
    const {id} = useParams();

    const [customer, setCustomer] =
        useState<any>(null);

    const [rides, setRides] =
        useState<any[]>([]);

    const [profileImage, setProfileImage] =
        useState<string | null>(null);

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [sectionSaving, setSectionSaving] = useState(false);
    const [sectionError, setSectionError] = useState("");
    const [customerStatusSaving, setCustomerStatusSaving] = useState(false);
    const [customerStatusError, setCustomerStatusError] = useState("");
    const [profileForm, setProfileForm] = useState({ nickname: "" });
    const [contactForm, setContactForm] = useState({
        mobileNumber: "",
        email: ""
    });
    const [addressForm, setAddressForm] = useState({
        address: "",
        city: "",
        postalCode: ""
    });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!id) {
            setError("Customer ID is missing.");
            setLoading(false);
            return;
        }

        const customerId = id;

        async function loadCustomer() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await adminApi.customer(customerId);

                const data =
                    response.data?.data ??
                    response.data;

                setCustomer(data);
            } catch (error: any) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load customer."
                );
            } finally {
                setLoading(false);
            }
        }

        loadCustomer();
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        const customerId = id;

        async function loadRides() {
            try {
                const response =
                    await adminApi.customerRides(customerId);

                const data =
                    response.data?.data ??
                    response.data;

                if (Array.isArray(data)) {
                    setRides(data);
                    return;
                }

                if (
                    data?.rides &&
                    Array.isArray(data.rides)
                ) {
                    setRides(data.rides);
                    return;
                }

                if (data?.rideId) {
                    setRides([data]);
                    return;
                }

                setRides([]);
            } catch {
                setRides([]);
            }
        }

        loadRides();
    }, [id]);

    useEffect(() => {
        if (!customer) {
            return;
        }

        const customerId =
            customer.profileId ??
            customer.id;

        if (!customerId) {
            setProfileImage(null);
            return;
        }

        let objectUrl: string | null = null;
        let cancelled = false;

        async function loadProfileImage() {
            try {
                const response =
                    await adminApi.profilePic(
                        customerId
                    );

                if (cancelled) {
                    return;
                }

                objectUrl =
                    URL.createObjectURL(
                        response.data
                    );

                setProfileImage(objectUrl);
            } catch {
                if (!cancelled) {
                    setProfileImage(null);
                }
            }
        }

        loadProfileImage();

        return () => {
            cancelled = true;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [customer]);

    const openProfileModal = () => {
        setSectionError("");
        setProfileForm({ nickname: customer.nickname ?? "" });
        setProfileModalOpen(true);
    };

    const openContactModal = () => {
        setSectionError("");
        setContactForm({
            mobileNumber: customer.mobileNumber ?? "",
            email: customer.email ?? ""
        });
        setContactModalOpen(true);
    };

    const openAddressModal = () => {
        setSectionError("");
        setAddressForm({
            address: customer.address ?? "",
            city: customer.city ?? "",
            postalCode: customer.postalCode ?? ""
        });
        setAddressModalOpen(true);
    };

    const closeSectionModal = () => {
        if (!sectionSaving) {
            setProfileModalOpen(false);
            setContactModalOpen(false);
            setAddressModalOpen(false);
            setSectionError("");
        }
    };

    const refreshCustomer = async () => {
        const response = await adminApi.customer(customerId);
        const data = response.data?.data ?? response.data;
        setCustomer(data);
    };

    const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSectionSaving(true);
            setSectionError("");
            await adminApi.updateCustomerProfile(customerId, profileForm);
            await refreshCustomer();
            setProfileModalOpen(false);
        } catch (error: any) {
            setSectionError(
                error.response?.data?.message ??
                "Unable to update profile information."
            );
        } finally {
            setSectionSaving(false);
        }
    };

    const handleContactUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSectionSaving(true);
            setSectionError("");
            await adminApi.updateCustomerContact(customerId, contactForm);
            await refreshCustomer();
            setContactModalOpen(false);
        } catch (error: any) {
            setSectionError(
                error.response?.data?.message ??
                "Unable to update contact information."
            );
        } finally {
            setSectionSaving(false);
        }
    };

    const handleAddressUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSectionSaving(true);
            setSectionError("");
            await adminApi.updateCustomerAddress(customerId, addressForm);
            await refreshCustomer();
            setAddressModalOpen(false);
        } catch (error: any) {
            setSectionError(
                error.response?.data?.message ??
                "Unable to update address."
            );
        } finally {
            setSectionSaving(false);
        }
    };

    const handleCustomerStatusChange = async (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const nextStatus = event.target.value;

        if (!customerId || !nextStatus || nextStatus === customer.status) {
            return;
        }

        try {
            setCustomerStatusSaving(true);
            setCustomerStatusError("");
            await adminApi.updateCustomerStatus(customerId, nextStatus);
            await refreshCustomer();
        } catch (error: any) {
            setCustomerStatusError(
                error.response?.data?.message ??
                "Unable to update customer status."
            );
        } finally {
            setCustomerStatusSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="panel loading-state">
                <div className="loading-content">
                    <span className="loading-spinner"/>
                    <span>
                        Loading customer...
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-box">
                {error}
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="error-box">
                Customer not found.
            </div>
        );
    }

    const customerId =
        customer.profileId ??
        customer.id;

    const fullName =
        customer.fullName ??
        `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

    const initials = getInitials(
        customer.firstName,
        customer.lastName,
        customer.fullName
    );

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>
                        Customer Details
                    </h1>

                    <p>
                        Customer profile and ride history.
                    </p>
                </div>
            </div>

            <div className="detail-grid">
                <section className="panel">
                    <div className="section-edit-header">
                        <h2>Profile</h2>
                        <div className="profile-actions">
                            <button
                                type="button"
                                className="section-edit-button"
                                onClick={openProfileModal}
                            >
                                Edit
                            </button>

                            <select
                                className={`rider-status-select rider-status-${String(
                                    customer.status ?? ""
                                )
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                value={customer.status ?? ""}
                                onChange={handleCustomerStatusChange}
                                disabled={customerStatusSaving}
                                aria-label="Customer account status"
                                title="Customer account status"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Verification">Verification</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {customerStatusError && (
                        <div className="rider-status-error">
                            {customerStatusError}
                        </div>
                    )}

                    <div className="profile-header">
                        <div className="profile-avatar">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={
                                        fullName ||
                                        "Customer"
                                    }
                                    onError={() => {
                                        setProfileImage(null);
                                    }}
                                />
                            ) : (
                                <span>
                                    {initials}
                                </span>
                            )}
                        </div>

                        <div className="profile-summary">
                            <h3>
                                {fullName ||
                                    "—"}
                            </h3>

                            {customer.nickname && (
                                <span>
                                    {
                                        customer.nickname
                                    }
                                </span>
                            )}

                            <span className="profile-id">
                                {customerId ??
                                    "—"}
                            </span>

                            {customer.status && (
                                <span
                                    className={`status status-${String(
                                        customer.status
                                    )
                                        .toLowerCase()
                                        .replace(
                                            /\s+/g,
                                            "-"
                                        )}`}
                                >
                                    {
                                        customer.status
                                    }
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="detail-list">
                        <DetailRow
                            label="First Name"
                            value={
                                customer.firstName
                            }
                        />

                        <DetailRow
                            label="Last Name"
                            value={
                                customer.lastName
                            }
                        />

                        <DetailRow
                            label="Full Name"
                            value={
                                customer.fullName
                            }
                        />

                        <DetailRow
                            label="Nickname"
                            value={
                                customer.nickname
                            }
                        />

                        <DetailRow
                            label="Date of Birth"
                            value={
                                customer.dateOfBirth
                                    ? formatDate(
                                        customer.dateOfBirth
                                    )
                                    : null
                            }
                        />

                        <DetailRow
                            label="Status"
                            value={
                                customer.status
                            }
                        />

                        <DetailRow
                            label="Wallet Balance"
                            value={formatCurrency(
                                customer.walletBalance
                            )}
                        />

                        <DetailRow
                            label="Created At"
                            value={formatDateTime(
                                customer.createdAt
                            )}
                        />
                    </div>
                </section>

                <section className="panel">
                    <div className="section-edit-header">
                        <h2>
                            Contact Information
                        </h2>
                        <button
                            type="button"
                            className="section-edit-button"
                            onClick={openContactModal}
                        >
                            Edit
                        </button>
                    </div>

                    <div className="detail-list">
                        <DetailRow
                            label="Mobile Number"
                            value={
                                customer.mobileNumber
                            }
                        />

                        <DetailRow
                            label="Email"
                            value={
                                customer.email
                            }
                        />
                    </div>
                </section>

                <section className="panel">
                    <div className="section-edit-header">
                        <h2>Address</h2>
                        <button
                            type="button"
                            className="section-edit-button"
                            onClick={openAddressModal}
                        >
                            Edit
                        </button>
                    </div>

                    <div className="detail-list">
                        <DetailRow
                            label="Address"
                            value={
                                customer.address
                            }
                        />

                        <DetailRow
                            label="City"
                            value={
                                customer.city
                            }
                        />

                        <DetailRow
                            label="Postal Code"
                            value={
                                customer.postalCode
                            }
                        />
                    </div>
                </section>
            </div>

            <div className="section-heading">
                <div>
                    <h2>Ride History</h2>

                    <p>
                        Rides associated with this customer.
                    </p>
                </div>
            </div>

            <div className="panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Ride ID</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Fare</th>
                            <th>Final Fare</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Action</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rides.length === 0 ? (
                            <tr>
                                <td colSpan={9}>
                                    <div className="empty-state">
                                        No ride history found.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rides.map(
                                (
                                    ride,
                                    index
                                ) => (
                                    <tr
                                        key={
                                            ride.rideId ??
                                            ride.id ??
                                            index
                                        }
                                    >
                                        <td className="ride-id">
                                            {(
                                                    ride.rideId ??
                                                    ride.id
                                                )
                                                    ?.slice(
                                                        0,
                                                        8
                                                    ) ??
                                                "—"}
                                        </td>

                                        <td>
                                            {ride.type ??
                                                "—"}
                                        </td>

                                        <td>
                                            {ride.category ??
                                                "—"}
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                ride.fare
                                            )}
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                ride.finalFare
                                            )}
                                        </td>

                                        <td>
                                            {ride.payMethod ??
                                                "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`status status-${String(
                                                    ride.status ??
                                                    ""
                                                )
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                            >
                                                {ride.status ??
                                                    "—"}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDateTime(
                                                ride.createdAt
                                            )}
                                        </td>

                                        <td>
                                            {detailLink(
                                                "/rides",
                                                ride.rideId ??
                                                ride.id,
                                                "View"
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(profileModalOpen || contactModalOpen || addressModalOpen) && (
                <div
                    className="section-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeSectionModal();
                        }
                    }}
                >
                    <div className="section-modal" role="dialog" aria-modal="true">
                        {profileModalOpen && (
                            <>
                                <div className="section-modal-header">
                                    <div>
                                        <span className="section-modal-kicker">CUSTOMER PROFILE</span>
                                        <h2>Edit Profile</h2>
                                        <p>Update the customer's nickname.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="section-modal-close"
                                        onClick={closeSectionModal}
                                        disabled={sectionSaving}
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="section-form-grid section-form-grid-single">
                                        <label className="section-form-field">
                                            <span>Nickname</span>
                                            <input
                                                value={profileForm.nickname}
                                                onChange={(event) =>
                                                    setProfileForm((current) => ({
                                                        ...current,
                                                        nickname: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                    </div>
                                    {sectionError && <div className="section-form-error">{sectionError}</div>}
                                    <div className="section-modal-footer">
                                        <button type="button" className="section-cancel-button" onClick={closeSectionModal} disabled={sectionSaving}>Cancel</button>
                                        <button type="submit" className="section-save-button" disabled={sectionSaving}>{sectionSaving ? "Saving…" : "Save Changes"}</button>
                                    </div>
                                </form>
                            </>
                        )}

                        {contactModalOpen && (
                            <>
                                <div className="section-modal-header">
                                    <div>
                                        <span className="section-modal-kicker">CONTACT INFORMATION</span>
                                        <h2>Edit Contact Information</h2>
                                        <p>Update the customer's contact details.</p>
                                    </div>
                                    <button type="button" className="section-modal-close" onClick={closeSectionModal} disabled={sectionSaving}>×</button>
                                </div>
                                <form onSubmit={handleContactUpdate}>
                                    <div className="section-form-grid section-form-grid-single">
                                        <label className="section-form-field">
                                            <span>Mobile Number</span>
                                            <input
                                                type="text"
                                                value={contactForm.mobileNumber}
                                                onChange={(event) =>
                                                    setContactForm((current) => ({
                                                        ...current,
                                                        mobileNumber: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                        <label className="section-form-field">
                                            <span>Email</span>
                                            <input
                                                type="email"
                                                value={contactForm.email}
                                                onChange={(event) =>
                                                    setContactForm((current) => ({
                                                        ...current,
                                                        email: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                    </div>
                                    {sectionError && <div className="section-form-error">{sectionError}</div>}
                                    <div className="section-modal-footer">
                                        <button type="button" className="section-cancel-button" onClick={closeSectionModal} disabled={sectionSaving}>Cancel</button>
                                        <button type="submit" className="section-save-button" disabled={sectionSaving}>{sectionSaving ? "Saving…" : "Save Changes"}</button>
                                    </div>
                                </form>
                            </>
                        )}

                        {addressModalOpen && (
                            <>
                                <div className="section-modal-header">
                                    <div>
                                        <span className="section-modal-kicker">ADDRESS</span>
                                        <h2>Edit Address</h2>
                                        <p>Update the customer's address information.</p>
                                    </div>
                                    <button type="button" className="section-modal-close" onClick={closeSectionModal} disabled={sectionSaving}>×</button>
                                </div>
                                <form onSubmit={handleAddressUpdate}>
                                    <div className="section-form-grid">
                                        <label className="section-form-field section-form-field-wide">
                                            <span>Address</span>
                                            <input
                                                value={addressForm.address}
                                                onChange={(event) =>
                                                    setAddressForm((current) => ({
                                                        ...current,
                                                        address: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                        <label className="section-form-field">
                                            <span>City</span>
                                            <input
                                                value={addressForm.city}
                                                onChange={(event) =>
                                                    setAddressForm((current) => ({
                                                        ...current,
                                                        city: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                        <label className="section-form-field">
                                            <span>Postal Code</span>
                                            <input
                                                value={addressForm.postalCode}
                                                onChange={(event) =>
                                                    setAddressForm((current) => ({
                                                        ...current,
                                                        postalCode: event.target.value
                                                    }))
                                                }
                                                disabled={sectionSaving}
                                            />
                                        </label>
                                    </div>
                                    {sectionError && <div className="section-form-error">{sectionError}</div>}
                                    <div className="section-modal-footer">
                                        <button type="button" className="section-cancel-button" onClick={closeSectionModal} disabled={sectionSaving}>Cancel</button>
                                        <button type="submit" className="section-save-button" disabled={sectionSaving}>{sectionSaving ? "Saving…" : "Save Changes"}</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
