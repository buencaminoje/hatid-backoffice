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

function formatCurrency(value: number | null | undefined) {
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
            .map((name: string) => name[0])
            .join("")
            .toUpperCase();
    }

    return "?";
}

export function RiderDetailPage() {
    const {id} = useParams();

    const [rider, setRider] = useState<any>(null);
    const [rides, setRides] = useState<any[]>([]);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [vehicleSaving, setVehicleSaving] = useState(false);
    const [vehicleError, setVehicleError] = useState("");
    const [vehicleForm, setVehicleForm] = useState({
        vehicleModel: "",
        vehicleType: "",
        vehicleColor: "",
        plateNo: "",
        vehicleStatus: "",
        licenseStatus: "",
        regBookStatus: ""
    });
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [sectionSaving, setSectionSaving] = useState(false);
    const [sectionError, setSectionError] = useState("");
    const [riderStatusSaving, setRiderStatusSaving] = useState(false);
    const [riderStatusError, setRiderStatusError] = useState("");
    const [profileForm, setProfileForm] = useState({
        firstName: "",
        lastName: "",
        fullName: "",
        nickname: ""
    });
    const [contactForm, setContactForm] = useState({
        mobileNumber: "",
        email: ""
    });
    const [addressForm, setAddressForm] = useState({
        address: "",
        city: "",
        postalCode: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            setError("Rider ID is missing.");
            setLoading(false);
            return;
        }

        async function loadRider() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await adminApi.rider(id);

                const data =
                    response.data?.data ??
                    response.data;

                setRider(data);
            } catch (error: any) {
                setError(
                    error.response?.data?.message ??
                    "Unable to load rider."
                );
            } finally {
                setLoading(false);
            }
        }

        loadRider();
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        async function loadRides() {
            try {
                const response =
                    await adminApi.riderRides(id);

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
        if (!rider) {
            return;
        }

        const riderId =
            rider.profileId ??
            rider.id;

        if (!riderId) {
            setProfileImage(null);
            return;
        }

        let objectUrl: string | null = null;
        let cancelled = false;

        async function loadProfileImage() {
            try {
                const response =
                    await adminApi.profilePic(
                        riderId
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
    }, [rider]);

    if (loading) {
        return (
            <div className="panel loading-state">
                <div className="loading-content">
                    <span className="loading-spinner"/>
                    <span>
                        Loading rider...
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

    if (!rider) {
        return (
            <div className="error-box">
                Rider not found.
            </div>
        );
    }

    const openVehicleModal = () => {
        setVehicleError("");
        setVehicleForm({
            vehicleModel: rider.vehicleModel ?? "",
            vehicleType: rider.vehicleType ?? "",
            vehicleColor: rider.vehicleColor ?? "",
            plateNo: rider.plateNo ?? "",
            vehicleStatus: rider.vehicleStatus ?? "",
            licenseStatus: rider.licenseStatus ?? "",
            regBookStatus: rider.regBookStatus ?? ""
        });
        setVehicleModalOpen(true);
    };

    const closeVehicleModal = () => {
        if (!vehicleSaving) {
            setVehicleModalOpen(false);
            setVehicleError("");
        }
    };

    const handleVehicleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!riderId) {
            return;
        }

        try {
            setVehicleSaving(true);
            setVehicleError("");

            const response = await adminApi.updateVehicle(
                riderId,
                vehicleForm
            );

            await refreshRider();
            setVehicleModalOpen(false);
        } catch (error: any) {
            setVehicleError(
                error.response?.data?.message ??
                "Unable to update vehicle information."
            );
        } finally {
            setVehicleSaving(false);
        }
    };

    const openProfileModal = () => {
        setSectionError("");
        setProfileForm({
            firstName: rider.firstName ?? "",
            lastName: rider.lastName ?? "",
            fullName: rider.fullName ?? "",
            nickname: rider.nickname ?? ""
        });
        setProfileModalOpen(true);
    };

    const openContactModal = () => {
        setSectionError("");
        setContactForm({
            mobileNumber: rider.mobileNumber ?? "",
            email: rider.email ?? ""
        });
        setContactModalOpen(true);
    };

    const openAddressModal = () => {
        setSectionError("");
        setAddressForm({
            address: rider.address ?? "",
            city: rider.city ?? "",
            postalCode: rider.postalCode ?? ""
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

    const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSectionSaving(true);
            setSectionError("");

            const response = await adminApi.updateRiderProfile(
                riderId,
                profileForm
            );

            await refreshRider();
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

            const response = await adminApi.updateRiderContact(
                riderId,
                contactForm
            );

            await refreshRider();
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

            const response = await adminApi.updateRiderAddress(
                riderId,
                addressForm
            );

            await refreshRider();
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


    const isVehicleInformationComplete = () => {
        return [
            rider.vehicleModel,
            rider.vehicleType,
            rider.vehicleColor,
            rider.plateNo,
            rider.vehicleStatus,
            rider.licenseStatus,
            rider.regBookStatus
        ].every((value) => String(value ?? "").trim() !== "");
    };

    const handleRiderStatusChange = async (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const nextStatus = event.target.value;

        if (!riderId || !nextStatus || nextStatus === rider.status) {
            return;
        }

        if (nextStatus === "Active" && !isVehicleInformationComplete()) {
            setRiderStatusError(
                "Vehicle information must be completed before the rider can be set to Active."
            );
            setVehicleError(
                "Complete all vehicle information before setting the rider to Active."
            );
            setVehicleForm({
                vehicleModel: rider.vehicleModel ?? "",
                vehicleType: rider.vehicleType ?? "",
                vehicleColor: rider.vehicleColor ?? "",
                plateNo: rider.plateNo ?? "",
                vehicleStatus: rider.vehicleStatus ?? "Pending",
                licenseStatus: rider.licenseStatus ?? "Pending",
                regBookStatus: rider.regBookStatus ?? "Pending"
            });
            setVehicleModalOpen(true);
            return;
        }

        try {
            setRiderStatusSaving(true);
            setRiderStatusError("");

            const response = await adminApi.updateRiderStatus(
                riderId,
                nextStatus
            );

            await refreshRider();
        } catch (error: any) {
            setRiderStatusError(
                error.response?.data?.message ??
                "Unable to update rider status."
            );
        } finally {
            setRiderStatusSaving(false);
        }
    };

    const refreshRider = async () => {
        const response = await adminApi.rider(riderId);
        const data = response.data?.data ?? response.data;
        setRider(data);
    };

    const riderId =
        rider.profileId ??
        rider.id;

    const fullName =
        rider.fullName ??
        `${rider.firstName ?? ""} ${rider.lastName ?? ""}`.trim();

    const initials = getInitials(
        rider.firstName,
        rider.lastName,
        rider.fullName
    );

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Rider Details</h1>

                    <p>
                        Rider profile and vehicle information.
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
    rider.status ?? ""
)
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
                                value={rider.status ?? ""}
                                onChange={handleRiderStatusChange}
                                disabled={riderStatusSaving}
                                aria-label="Rider account status"
                                title={
                                    isVehicleInformationComplete()
                                        ? "Rider account status"
                                        : "Complete vehicle information before setting Active"
                                }
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Verification">Verification</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {riderStatusError && (
                        <div className="rider-status-error">
                            {riderStatusError}
                        </div>
                    )}

                    {!isVehicleInformationComplete() && rider.status !== "Active" && (
                        <div className="vehicle-completion-warning">
                            Complete the vehicle information before setting this rider to Active.
                        </div>
                    )}

                    <div className="profile-header">
                        <div className="profile-avatar">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={
                                        fullName ||
                                        "Rider"
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
                                {fullName || "—"}
                            </h3>

                            {rider.nickname && (
                                <span>
                                    {rider.nickname}
                                </span>
                            )}

                            <span className="profile-id">
                                {riderId ?? "—"}
                            </span>

                            {rider.status && (
                                <span
                                    className={`status status-${String(
    rider.status
)
    .toLowerCase()
    .replace(
        /\s+/g,
        "-"
    )}`}
                                >
                                    {rider.status}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="detail-list">
                        <DetailRow
                            label="First Name"
                            value={rider.firstName}
                        />

                        <DetailRow
                            label="Last Name"
                            value={rider.lastName}
                        />

                        <DetailRow
                            label="Full Name"
                            value={rider.fullName}
                        />

                        <DetailRow
                            label="Nickname"
                            value={rider.nickname}
                        />

                        <DetailRow
                            label="Date of Birth"
                            value={
                                rider.dateOfBirth
                                    ? formatDate(
                                        rider.dateOfBirth
                                    )
                                    : null
                            }
                        />

                        <DetailRow
                            label="Status"
                            value={rider.status}
                        />

                        <DetailRow
                            label="Wallet Balance"
                            value={formatCurrency(
                                rider.walletBalance
                            )}
                        />

                        <DetailRow
                            label="Online Status"
                            value={
                                rider.isOnline
                                    ? "Online"
                                    : "Offline"
                            }
                        />

                        <DetailRow
                            label="Last Updated"
                            value={formatDateTime(
                                rider.lastUpdated
                            )}
                        />

                        <DetailRow
                            label="Created At"
                            value={formatDateTime(
                                rider.createdAt
                            )}
                        />
                    </div>
                </section>

                <section className="panel">
                    <div className="section-edit-header">
                        <h2>Contact Information</h2>
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
                            value={rider.mobileNumber}
                        />

                        <DetailRow
                            label="Email"
                            value={rider.email}
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
                            value={rider.address}
                        />

                        <DetailRow
                            label="City"
                            value={rider.city}
                        />

                        <DetailRow
                            label="Postal Code"
                            value={rider.postalCode}
                        />
                    </div>
                </section>

                <section className="panel">
                    <div className="vehicle-header">
                        <h2>Vehicle</h2>
                        <button
                            type="button"
                            className="vehicle-edit-button"
                            onClick={openVehicleModal}
                        >
                            Edit
                        </button>
                    </div>

                    <div className="detail-list">
                        <DetailRow
                            label="Model"
                            value={rider.vehicleModel}
                        />

                        <DetailRow
                            label="Type"
                            value={rider.vehicleType}
                        />

                        <DetailRow
                            label="Color"
                            value={rider.vehicleColor}
                        />

                        <DetailRow
                            label="Plate Number"
                            value={rider.plateNo}
                        />

                        <DetailRow
                            label="Vehicle Status"
                            value={rider.vehicleStatus}
                        />

                        <DetailRow
                            label="License Status"
                            value={rider.licenseStatus}
                        />

                        <DetailRow
                            label="Registration Status"
                            value={rider.regBookStatus}
                        />
                    </div>
                </section>

                <section className="panel">
                    <h2>Current Location</h2>

                    <div className="detail-list">
                        <DetailRow
                            label="Latitude"
                            value={rider.lat}
                        />

                        <DetailRow
                            label="Longitude"
                            value={rider.lng}
                        />

                        <DetailRow
                            label="Online Status"
                            value={
                                rider.isOnline
                                    ? "Online"
                                    : "Offline"
                            }
                        />

                        <DetailRow
                            label="Last Updated"
                            value={formatDateTime(
                                rider.lastUpdated
                            )}
                        />
                    </div>

                    {rider.lat != null &&
                        rider.lng != null && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${rider.lat},${rider.lng}`}
    target="_blank"
rel="noopener noreferrer"
className="map-route-link"
    >
    View Current Location
</a>
)}
</section>
</div>

<div className="section-heading">
    <div>
        <h2>Ride History</h2>

        <p>
            Rides associated with this rider.
        </p>
    </div>
</div>

<div className="panel">
    <div className="table-wrap">
        <table>
            <thead>
            <tr>
                <th>Ride ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Category</th>
                <th>Fare</th>
                <th>Final Fare</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
                <th>Accepted</th>
                <th>Arrived</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Action</th>
            </tr>
            </thead>

            <tbody>
            {rides.length === 0 ? (
                <tr>
                    <td colSpan={14}>
                        <div className="empty-state">
                            No ride history found.
                        </div>
                    </td>
                </tr>
            ) : (
                rides.map(
                    (ride, index) => (
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
                                    ) ?? "—"}
                            </td>

                            <td>
                                {ride.customer
                                        ?.name ??
                                    ride.customerName ??
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
                                {formatDateTime(
                                    ride.acceptedAt
                                )}
                            </td>

                            <td>
                                {formatDateTime(
                                    ride.arrivedAt
                                )}
                            </td>

                            <td>
                                {formatDateTime(
                                    ride.startedAt
                                )}
                            </td>

                            <td>
                                {formatDateTime(
                                    ride.completedAt
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
                            <span className="section-modal-kicker">RIDER PROFILE</span>
                            <h2>Edit Profile</h2>
                            <p>Update the rider's personal information.</p>
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
                            <p>Update the rider's contact details.</p>
                        </div>
                        <button type="button" className="section-modal-close" onClick={closeSectionModal} disabled={sectionSaving}>×</button>
                    </div>
                    <form onSubmit={handleContactUpdate}>
                        <div className="section-form-grid section-form-grid-single">
                            {[
                                ["mobileNumber", "Mobile Number"],
                                ["email", "Email"]
                            ].map(([field, label]) => (
                                <label className="section-form-field" key={field}>
                                    <span>{label}</span>
                                    <input
                                        type={field === "email" ? "email" : "text"}
                                        value={contactForm[field as keyof typeof contactForm]}
                                        onChange={(event) =>
                                            setContactForm((current) => ({
                                                ...current,
                                                [field]: event.target.value
                                            }))
                                        }
                                        disabled={sectionSaving}
                                    />
                                </label>
                            ))}
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
                            <p>Update the rider's address information.</p>
                        </div>
                        <button type="button" className="section-modal-close" onClick={closeSectionModal} disabled={sectionSaving}>×</button>
                    </div>
                    <form onSubmit={handleAddressUpdate}>
                        <div className="section-form-grid">
                            {[
                                ["address", "Address"],
                                ["city", "City"],
                                ["postalCode", "Postal Code"]
                            ].map(([field, label]) => (
                                <label className={`section-form-field${field === "address" ? " section-form-field-wide" : ""}`} key={field}>
                                    <span>{label}</span>
                                    <input
                                        value={addressForm[field as keyof typeof addressForm]}
                                        onChange={(event) =>
                                            setAddressForm((current) => ({
                                                ...current,
                                                [field]: event.target.value
                                            }))
                                        }
                                        disabled={sectionSaving}
                                    />
                                </label>
                            ))}
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

{vehicleModalOpen && (
    <div className="vehicle-modal-overlay" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeVehicleModal();
    }}>
        <div className="vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title">
            <div className="vehicle-modal-header">
                <div>
                    <span className="vehicle-modal-kicker">RIDER VEHICLE</span>
                    <h2 id="vehicle-modal-title">Edit Vehicle</h2>
                    <p>Update the vehicle details and document status.</p>
                </div>
                <button type="button" className="vehicle-modal-close" onClick={closeVehicleModal} disabled={vehicleSaving} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleVehicleUpdate}>
                <div className="vehicle-form-grid">
                    {[
                        ["vehicleModel", "Vehicle Model"],
                        ["vehicleColor", "Color"],
                        ["plateNo", "Plate Number"]
                    ].map(([field, label]) => (
                        <label className="vehicle-form-field" key={field}>
                            <span>{label}</span>
                            <input
                                value={vehicleForm[field as keyof typeof vehicleForm]}
                                onChange={(event) => setVehicleForm((current) => ({ ...current, [field]: event.target.value }))}
                                disabled={vehicleSaving}
                            />
                        </label>
                    ))}

                    <label className="vehicle-form-field">
                        <span>Vehicle Type</span>
                        <select
                            value={vehicleForm.vehicleType}
                            onChange={(event) => setVehicleForm((current) => ({ ...current, vehicleType: event.target.value }))}
                            disabled={vehicleSaving}
                        >
                            <option value="">Select vehicle type</option>
                            <option value="Motorcycle">Motorcycle</option>
                            <option value="Tricycle">Tricycle</option>
                            <option value="Car">Car</option>
                            <option value="Pickup">Pickup</option>
                        </select>
                    </label>

                    {[
                        ["vehicleStatus", "Vehicle Status"],
                        ["licenseStatus", "License Status"],
                        ["regBookStatus", "Registration Status"]
                    ].map(([field, label]) => (
                        <label className="vehicle-form-field" key={field}>
                            <span>{label}</span>
                            <select
                                value={vehicleForm[field as keyof typeof vehicleForm]}
                                onChange={(event) => setVehicleForm((current) => ({ ...current, [field]: event.target.value }))}
                                disabled={vehicleSaving}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Verification">Verification</option>
                                <option value="Approved">Approved</option>
                            </select>
                        </label>
                    ))}
                </div>
                {vehicleError && <div className="vehicle-form-error">{vehicleError}</div>}
                <div className="vehicle-modal-footer">
                    <button type="button" className="vehicle-cancel-button" onClick={closeVehicleModal} disabled={vehicleSaving}>Cancel</button>
                    <button type="submit" className="vehicle-save-button" disabled={vehicleSaving}>{vehicleSaving ? "Saving…" : "Save Changes"}</button>
                </div>
            </form>
        </div>
    </div>
)}
</>
);
}