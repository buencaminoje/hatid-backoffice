import {useEffect, useState} from "react";
import {adminApi} from "../api/admin";
import {detailLink} from "./ListPage";

export function AvailableRidesPage() {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadRides() {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.availableRides();

                if (!mounted) {
                    return;
                }

                const data =
                    response.data?.data ??
                    response.data ??
                    [];

                setRides(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (error: any) {
                if (!mounted) {
                    return;
                }

                setError(
                    error.response?.data?.message ??
                    "Unable to load available rides."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadRides();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="panel loading-state">
                <div className="loading-content">
                    <span className="loading-spinner"/>
                    <span>Loading available rides...</span>
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

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Available Rides</h1>

                    <p>
                        Rides currently waiting for a rider.
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
                            <th>Pickup</th>
                            <th>Destination</th>
                            <th>Fare</th>
                            <th>Payment</th>
                            <th>Details</th>
                            <th>Notes</th>
                            <th>Requested</th>
                            <th>Action</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rides.length === 0 ? (
                            <tr>
                                <td colSpan={11}>
                                    <div className="empty-state">
                                        No rides are currently available.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rides.map((ride, index) => {
                                const isDelivery =
                                    ride.type === "Delivery";

                                const details =
                                    isDelivery &&
                                    ride.deliveryDetails
                                        ? [
                                            ride.deliveryDetails.isPabili
                                                ? "Pabili"
                                                : "Standard Delivery",

                                            ride.deliveryDetails
                                                .packageDescription
                                                ? `Package: ${ride.deliveryDetails.packageDescription}`
                                                : null,

                                            ride.deliveryDetails.senderName
                                                ? `Sender: ${ride.deliveryDetails.senderName}`
                                                : null,

                                            ride.deliveryDetails.receiverName
                                                ? `Receiver: ${ride.deliveryDetails.receiverName}`
                                                : null,

                                            ride.deliveryDetails.isPabili &&
                                            ride.deliveryDetails
                                                .estimatedPurchaseAmount != null
                                                ? `Purchase: ₱${Number(
                                                    ride.deliveryDetails
                                                        .estimatedPurchaseAmount
                                                ).toFixed(2)}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" • ")
                                        : ride.passengerCount != null
                                            ? `${ride.passengerCount} passenger${
                                                ride.passengerCount === 1
                                                    ? ""
                                                    : "s"
                                            }`
                                            : "—";

                                return (
                                    <tr
                                        key={
                                            ride.id ??
                                            ride.rideId ??
                                            index
                                        }
                                    >
                                        <td className="ride-id">
                                            {
                                                (
                                                    ride.id ??
                                                    ride.rideId ??
                                                    ""
                                                ).slice(0, 8) || "—"
                                            }
                                        </td>

                                        <td>
                                            {ride.customerName ?? "—"}
                                        </td>

                                        <td>
                                            {ride.type ?? "—"}
                                        </td>

                                        <td>
                                            <span className="location-cell">
                                                {
                                                    ride.pickupAddress ??
                                                    "—"
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            <span className="location-cell">
                                                {
                                                    ride.dropAddress ??
                                                    "—"
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            {ride.fare != null
                                                ? `₱${Number(
                                                    ride.fare
                                                ).toFixed(2)}`
                                                : "—"}
                                        </td>

                                        <td>
                                            {ride.payMethod ?? "—"}
                                        </td>

                                        <td>
                                            {details}
                                        </td>

                                        <td>
                                            {ride.notes ?? "—"}
                                        </td>

                                        <td>
                                            {ride.requestedAt
                                                ? new Date(
                                                    ride.requestedAt
                                                ).toLocaleString()
                                                : "—"}
                                        </td>

                                        <td>
                                            {detailLink(
                                                "/rides",
                                                ride.id ?? ride.rideId,
                                                "View"
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}