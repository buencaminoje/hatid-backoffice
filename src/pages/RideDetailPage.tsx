import {useEffect, useState, type ReactNode} from "react";
import {Link, useParams} from "react-router-dom";
import {adminApi} from "../api/admin";
import {apiClient} from "../api/client";

type NearbyRider = {
    profile_id: string;
    full_name: string | null;
    vehicle_model: string | null;
    vehicle_type: string | null;
    plate_no: string | null;
    lat: number | null;
    lng: number | null;
    distance: number | null;
};

function DetailRow({
                       label,
                       value,
                   }: {
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="detail-row">
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
        </div>
    );
}

function PersonCard({
                        person,
                        imageUrl,
                        fallback,
                        detailPath,
                    }: {
    person?: any;
    imageUrl: string | null;
    fallback: string;
    detailPath?: string;
}) {
    if (!person) {
        return (
            <div className="empty-person">
                Not available
            </div>
        );
    }

    const name =
        person.name ??
        person.full_name ??
        person.fullName ??
        "Unknown";

    const nickname =
        person.nickname;

    const mobileNumber =
        person.mobileNumber ??
        person.mobile_number;

    const content = (
        <div className="person-card">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name}
                    className="person-image"
                />
            ) : (
                <div className="person-avatar">
                    {name
                            ?.charAt(0)
                            ?.toUpperCase() ??
                        fallback}
                </div>
            )}

            <div>
                <strong>
                    {name}
                </strong>

                {nickname &&
                    nickname !== name && (
                        <span>
                            {nickname}
                        </span>
                    )}

                <span>
                    {mobileNumber ?? "—"}
                </span>
            </div>
        </div>
    );

    if (!detailPath) {
        return content;
    }

    return (
        <Link
            to={detailPath}
            className="person-card-link"
        >
            {content}
        </Link>
    );
}

export function RideDetailPage() {
    const {id} = useParams();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [customerImage, setCustomerImage] =
        useState<string | null>(null);

    const [riderImage, setRiderImage] =
        useState<string | null>(null);

    const [nearbyRiders, setNearbyRiders] =
        useState<NearbyRider[]>([]);

    const [nearbyLoading, setNearbyLoading] =
        useState(false);

    const [nearbyError, setNearbyError] =
        useState("");

    const [acceptingRiderId, setAcceptingRiderId] =
        useState<string | null>(null);

    async function loadRide(rideId: string) {
        const response = await adminApi.ride(rideId);
        return response.data?.data ?? response.data;
    }

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("Ride ID is missing.");
            return;
        }

        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const ride = await loadRide(id);

                if (!cancelled) {
                    setData(ride);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setError(
                        error.response?.data?.message ??
                        "Unable to load ride."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        const isPending =
            String(data?.status ?? "").toLowerCase() ===
            "pending";

        if (!data?.rideId || !isPending) {
            setNearbyRiders([]);
            setNearbyError("");
            setNearbyLoading(false);
            return;
        }

        let cancelled = false;

        async function loadNearbyRiders() {
            try {
                setNearbyLoading(true);
                setNearbyError("");

                const response = await apiClient.get(
                    "/api/ride/nearby",
                    {
                        params: {
                            rideId: data.rideId,
                        },
                    }
                );

                if (cancelled) {
                    return;
                }

                const result =
                    response.data?.data ??
                    response.data ??
                    [];

                setNearbyRiders(
                    Array.isArray(result)
                        ? result
                        : []
                );
            } catch (error: any) {
                if (!cancelled) {
                    setNearbyRiders([]);

                    setNearbyError(
                        error.response?.data?.message ??
                        "Unable to load nearby riders."
                    );
                }
            } finally {
                if (!cancelled) {
                    setNearbyLoading(false);
                }
            }
        }

        loadNearbyRiders();

        return () => {
            cancelled = true;
        };
    }, [data?.rideId, data?.status]);

    useEffect(() => {
        if (!data) {
            return;
        }

        let customerUrl: string | null = null;
        let riderUrl: string | null = null;
        let cancelled = false;

        async function getImage(path: string) {
            const response = await apiClient.get(
                "/api" + path,
                {
                    responseType: "blob",
                    headers: {
                        Accept: "image/*",
                    },
                }
            );

            return URL.createObjectURL(
                response.data
            );
        }

        async function loadImages() {
            const [
                customerResult,
                riderResult,
            ] = await Promise.allSettled([
                data.customer?.profilePic
                    ? getImage(
                        data.customer.profilePic
                    )
                    : Promise.resolve(null),

                data.rider?.profilePic
                    ? getImage(
                        data.rider.profilePic
                    )
                    : Promise.resolve(null),
            ]);

            if (cancelled) {
                return;
            }

            if (
                customerResult.status ===
                "fulfilled" &&
                customerResult.value
            ) {
                customerUrl =
                    customerResult.value;

                setCustomerImage(
                    customerUrl
                );
            } else {
                setCustomerImage(null);
            }

            if (
                riderResult.status ===
                "fulfilled" &&
                riderResult.value
            ) {
                riderUrl =
                    riderResult.value;

                setRiderImage(
                    riderUrl
                );
            } else {
                setRiderImage(null);
            }
        }

        loadImages();

        return () => {
            cancelled = true;

            if (customerUrl) {
                URL.revokeObjectURL(
                    customerUrl
                );
            }

            if (riderUrl) {
                URL.revokeObjectURL(
                    riderUrl
                );
            }
        };
    }, [data]);

    async function acceptRideForRider(
        rider: NearbyRider
    ) {
        if (
            !data?.rideId ||
            !rider.profile_id
        ) {
            return;
        }

        try {
            setAcceptingRiderId(
                rider.profile_id
            );

            setNearbyError("");

            await adminApi.acceptRide(
                data.rideId,
                rider.profile_id
            );

            const updatedRide =
                await loadRide(
                    data.rideId
                );

            setData(updatedRide);
            setNearbyRiders([]);
        } catch (error: any) {
            setNearbyError(
                error.response?.data?.message ??
                "Unable to accept ride for this rider."
            );
        } finally {
            setAcceptingRiderId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel loading-state">
                <div className="loading-content">
                    <span className="loading-spinner"/>
                    <span>
                        Loading details...
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

    if (!data) {
        return (
            <div className="panel empty-state">
                Ride not found.
            </div>
        );
    }

    const normalizedStatus =
        String(data.status ?? "")
            .toLowerCase();

    const isDelivery =
        data.type === "Delivery";

    const isPending =
        normalizedStatus === "pending";

    const isStarted =
        normalizedStatus === "started";

    const isInactiveRide = [
        "pending",
        "cancelled",
        "completed",
    ].includes(normalizedStatus);

    const fare = (
        value?: number | null
    ) =>
        value == null
            ? "—"
            : `₱${Number(value).toFixed(2)}`;

    const formatDateTime = (
        value?: string | null
    ) =>
        value
            ? new Date(
                value
            ).toLocaleString()
            : "—";

    const hasPickupCoordinates =
        data.pickupLat != null &&
        data.pickupLng != null;

    const hasDropCoordinates =
        data.dropLat != null &&
        data.dropLng != null;

    const hasRiderCoordinates =
        data.rider?.lat != null &&
        data.rider?.lng != null;

    const riderRouteDestination =
        isStarted
            ? {
                lat: data.dropLat,
                lng: data.dropLng,
                label: isDelivery
                    ? "Drop-off"
                    : "Destination",
            }
            : {
                lat: data.pickupLat,
                lng: data.pickupLng,
                label: "Pickup",
            };

    const canOpenRiderRoute =
        !!data.rider &&
        hasRiderCoordinates &&
        !isInactiveRide &&
        riderRouteDestination.lat != null &&
        riderRouteDestination.lng != null;

    const hasPromo =
        !!data.appliedPromo;

    const customerProfileId =
        data.customer?.profileId ??
        data.customer?.profile_id ??
        data.customer?.id;

    const riderProfileId =
        data.rider?.profileId ??
        data.rider?.profile_id ??
        data.rider?.id;

    const customerDetailPath =
        customerProfileId
            ? `/customers/${customerProfileId}`
            : undefined;

    const riderDetailPath =
        riderProfileId
            ? `/riders/${riderProfileId}`
            : undefined;

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>
                        {isDelivery
                            ? "Delivery Details"
                            : "Ride Details"}
                    </h1>
                </div>

                <span
                    className={`status status-${(
                        data.status ?? ""
                    )
                        .toLowerCase()
                        .replace(
                            /\s+/g,
                            "-"
                        )}`}
                >
                    {data.status ??
                        "Unknown"}
                </span>
            </div>

            <div className="detail-grid">
                <section className="panel">
                    <h2>
                        {isDelivery
                            ? "Delivery Information"
                            : "Ride Information"}
                    </h2>

                    <div className="detail-list">
                        <DetailRow
                            label="ID"
                            value={data.rideId}
                        />

                        <DetailRow
                            label="Type"
                            value={data.type}
                        />

                        <DetailRow
                            label="Category"
                            value={data.category}
                        />

                        <DetailRow
                            label="Status"
                            value={data.status}
                        />

                        <DetailRow
                            label="Fare"
                            value={fare(
                                data.fare
                            )}
                        />

                        {hasPromo && (
                            <DetailRow
                                label="Promo Discount"
                                value={
                                    <span className="promo-discount-value">
                                        -
                                        {fare(
                                            data.appliedPromo
                                                ?.discountApplied
                                        )}
                                    </span>
                                }
                            />
                        )}

                        <DetailRow
                            label="Final Fare"
                            value={
                                <span className="final-fare-value">
                                    {fare(
                                        data.finalFare
                                    )}
                                </span>
                            }
                        />

                        <DetailRow
                            label="Payment"
                            value={data.payMethod}
                        />

                        <DetailRow
                            label="Remarks"
                            value={
                                data.remarks ||
                                "No remarks"
                            }
                        />

                        <DetailRow
                            label="Notes"
                            value={
                                data.notes ||
                                "No notes"
                            }
                        />
                    </div>
                </section>

                <section className="panel">
                    <h2>Timeline</h2>

                    <div className="detail-list">
                        <DetailRow
                            label="Created"
                            value={formatDateTime(
                                data.createdAt
                            )}
                        />

                        <DetailRow
                            label="Accepted"
                            value={formatDateTime(
                                data.acceptedAt
                            )}
                        />

                        <DetailRow
                            label="Arrived"
                            value={formatDateTime(
                                data.arrivedAt
                            )}
                        />

                        <DetailRow
                            label="Started"
                            value={formatDateTime(
                                data.startedAt
                            )}
                        />

                        <DetailRow
                            label="Completed"
                            value={formatDateTime(
                                data.completedAt
                            )}
                        />

                        <DetailRow
                            label="Cancelled"
                            value={formatDateTime(
                                data.cancelledAt
                            )}
                        />
                    </div>
                </section>

                {hasPromo && (
                    <section className="panel">
                        <h2>Applied Promo</h2>

                        <div className="detail-list">
                            <DetailRow
                                label="Discount"
                                value={fare(
                                    data.appliedPromo
                                        ?.discountApplied
                                )}
                            />

                            <DetailRow
                                label="Status"
                                value={
                                    data.appliedPromo
                                        ?.status
                                }
                            />
                        </div>
                    </section>
                )}

                <section className="panel">
                    <h2>Route</h2>

                    <div className="route-location">
                        <div className="route-marker pickup-marker"/>

                        <div className="route-content">
                            <span className="location-label">
                                PICKUP
                            </span>

                            <strong>
                                {data.pickupLocation ??
                                    "—"}
                            </strong>

                            {hasPickupCoordinates && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${data.pickupLat},${data.pickupLng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="map-text-link"
                                >
                                    View on Google Maps ↗
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="route-connection">
                        <div className="route-line"/>
                    </div>

                    <div className="route-location">
                        <div className="route-marker drop-marker"/>

                        <div className="route-content">
                            <span className="location-label">
                                {isDelivery
                                    ? "DROP-OFF"
                                    : "DESTINATION"}
                            </span>

                            <strong>
                                {data.dropLocation ??
                                    "—"}
                            </strong>

                            {hasDropCoordinates && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${data.dropLat},${data.dropLng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="map-text-link"
                                >
                                    View on Google Maps ↗
                                </a>
                            )}
                        </div>
                    </div>

                    {hasPickupCoordinates &&
                        hasDropCoordinates && (
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${data.pickupLat},${data.pickupLng}&destination=${data.dropLat},${data.dropLng}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-route-link"
                            >
                                Open Route in Google Maps
                            </a>
                        )}
                </section>

                <section className="panel">
                    <h2>Customer</h2>

                    <PersonCard
                        person={data.customer}
                        imageUrl={customerImage}
                        fallback="C"
                        detailPath={
                            customerDetailPath
                        }
                    />
                </section>

                {isPending ? (
                    <section className="panel">
                        <h2>Nearby Riders</h2>

                        {nearbyLoading ? (
                            <div className="loading-content">
                                <span className="loading-spinner"/>
                                <span>
                                    Loading nearby riders...
                                </span>
                            </div>
                        ) : nearbyError ? (
                            <div className="error-box">
                                {nearbyError}
                            </div>
                        ) : nearbyRiders.length === 0 ? (
                            <div className="empty-person">
                                No nearby riders found.
                            </div>
                        ) : (
                            <div className="nearby-riders-list">
                                {nearbyRiders.map(
                                    (rider) => {
                                        const name =
                                            rider.full_name ??
                                            "Unknown Rider";

                                        const vehicle = [
                                            rider.vehicle_model,
                                            rider.vehicle_type,
                                            rider.plate_no,
                                        ]
                                            .filter(Boolean)
                                            .join(" • ");

                                        return (
                                            <div
                                                key={
                                                    rider.profile_id
                                                }
                                                className="nearby-rider-card"
                                            >
                                                <div className="nearby-rider-main">
                                                    <div className="nearby-rider-avatar">
                                                        {name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="nearby-rider-info">
                                                        <div className="nearby-rider-name-row">
                                                            <strong>
                                                                {name}
                                                            </strong>

                                                            {rider.distance !=
                                                                null && (
                                                                    <span className="nearby-rider-distance">
                                                                        {Number(
                                                                            rider.distance
                                                                        ).toFixed(
                                                                            2
                                                                        )}{" "}
                                                                        km away
                                                                    </span>
                                                                )}
                                                        </div>

                                                        <span className="nearby-rider-vehicle">
                                                            {vehicle ||
                                                                "Vehicle information unavailable"}
                                                        </span>

                                                        {rider.lat !=
                                                            null &&
                                                            rider.lng !=
                                                            null && (
                                                                <a
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${rider.lat},${rider.lng}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="nearby-rider-location"
                                                                >
                                                                    View current location ↗
                                                                </a>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="nearby-rider-actions">
                                                    <button
                                                        type="button"
                                                        className="nearby-rider-accept"
                                                        disabled={
                                                            acceptingRiderId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            acceptRideForRider(
                                                                rider
                                                            )
                                                        }
                                                    >
                                                        {acceptingRiderId ===
                                                        rider.profile_id
                                                            ? "Accepting..."
                                                            : "Accept Ride"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="panel">
                        <h2>Rider</h2>

                        {data.rider ? (
                            <>
                                <PersonCard
                                    person={data.rider}
                                    imageUrl={riderImage}
                                    fallback="R"
                                    detailPath={
                                        riderDetailPath
                                    }
                                />

                                <div className="detail-list rider-details">
                                    <DetailRow
                                        label="Rating"
                                        value={
                                            data.rider.rating ??
                                            "—"
                                        }
                                    />

                                    <DetailRow
                                        label="Vehicle Model"
                                        value={
                                            data.rider.vehicleModel
                                        }
                                    />

                                    <DetailRow
                                        label="Vehicle Type"
                                        value={
                                            data.rider.vehicleType
                                        }
                                    />

                                    <DetailRow
                                        label="Plate Number"
                                        value={
                                            data.rider.plateNumber
                                        }
                                    />

                                    <DetailRow
                                        label="Vehicle Color"
                                        value={
                                            data.rider.vehicleColor
                                        }
                                    />

                                    <DetailRow
                                        label="Last Position"
                                        value={
                                            hasRiderCoordinates ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${data.rider.lat},${data.rider.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="map-text-link"
                                                >
                                                    View current location ↗
                                                </a>
                                            ) : (
                                                "Not available"
                                            )
                                        }
                                    />

                                    {canOpenRiderRoute && (
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&origin=${data.rider.lat},${data.rider.lng}&destination=${riderRouteDestination.lat},${riderRouteDestination.lng}&travelmode=driving`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rider-route-button"
                                        >
                                            <span>
                                                Route to{" "}
                                                {
                                                    riderRouteDestination.label
                                                }
                                            </span>

                                            <span>
                                                ↗
                                            </span>
                                        </a>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="empty-person">
                                No rider assigned.
                            </div>
                        )}
                    </section>
                )}

                {isDelivery &&
                    data.deliveryDetails && (
                        <section className="panel delivery-details">
                            <h2>Delivery Details</h2>

                            <div className="detail-list">
                                <DetailRow
                                    label="Pabili"
                                    value={
                                        data.deliveryDetails
                                            .isPabili
                                            ? "Yes"
                                            : "No"
                                    }
                                />

                                <DetailRow
                                    label="Estimated Purchase Amount"
                                    value={fare(
                                        data.deliveryDetails
                                            .estimatedPurchaseAmount
                                    )}
                                />

                                <DetailRow
                                    label="Sender"
                                    value={
                                        data.deliveryDetails
                                            .senderName
                                    }
                                />

                                <DetailRow
                                    label="Sender Contact"
                                    value={
                                        data.deliveryDetails
                                            .senderContactNumber
                                    }
                                />

                                <DetailRow
                                    label="Receiver"
                                    value={
                                        data.deliveryDetails
                                            .receiverName
                                    }
                                />

                                <DetailRow
                                    label="Receiver Contact"
                                    value={
                                        data.deliveryDetails
                                            .receiverContactNumber
                                    }
                                />

                                <DetailRow
                                    label="Package Description"
                                    value={
                                        data.deliveryDetails
                                            .packageDescription
                                    }
                                />

                                <DetailRow
                                    label="Pickup Instructions"
                                    value={
                                        data.deliveryDetails
                                            .pickupInstructions
                                    }
                                />

                                <DetailRow
                                    label="Delivery Instructions"
                                    value={
                                        data.deliveryDetails
                                            .deliveryInstructions
                                    }
                                />
                            </div>
                        </section>
                    )}
            </div>
        </>
    );
}