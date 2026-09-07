import {Navigate, Outlet, Route, Routes} from "react-router-dom";
import {LoginPage} from "./pages/LoginPage";
import {DashboardPage} from "./pages/DashboardPage";
import {SalesPage} from "./pages/SalesPage";
import {ListPage, detailLink} from "./pages/ListPage";
import {RideDetailPage} from "./pages/RideDetailPage";
import {CustomerDetailPage} from "./pages/CustomerDetailPage";
import {RiderDetailPage} from "./pages/RiderDetailPage";
import {adminApi} from "./api/admin";
import {tokenStorage} from "./api/client";
import {AppShell} from "./components/AppShell";
import {AvailableRidesPage} from "./pages/AvailableRidesPage";
import {PromoPage} from "./pages/PromoPage";
import {RemittancePage} from "./pages/RemittancePage";

function Protected() {
    const token = tokenStorage.getAccessToken();

    if (!token) {
        return <Navigate to="/login" replace/>;
    }

    return <AppShell/>;
}

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage/>}
            />

            <Route element={<Protected/>}>
                <Route
                    path="/"
                    element={<DashboardPage/>}
                />

                <Route
                    path="/sales"
                    element={<SalesPage/>}
                />

                <Route
                    path="/remittances"
                    element={<RemittancePage/>}
                />

                <Route
                    path="/available-rides"
                    element={<AvailableRidesPage/>}
                />

                <Route
                    path="/rides"
                    element={
                        <ListPage
                            title="Rides"
                            description="Search and review all ride activity."
                            load={adminApi.rides}
                            columns={[
                                "Ride ID",
                                "Pickup",
                                "Destination",
                                "Type",
                                "Category",
                                "Fare",
                                "Payment",
                                "Status",
                                "Created",
                                "Action"
                            ]}
                            render={ride => [
                                <span className="ride-id">
                                    {ride.rideId?.slice(0, 8) ?? "—"}
                                </span>,

                                <span className="location-cell">
                                    {ride.pickupLocation ?? "—"}
                                </span>,

                                <span className="location-cell">
                                    {ride.dropLocation ?? "—"}
                                </span>,

                                ride.type ?? "—",

                                ride.category ?? "—",

                                `₱${Number(
    ride.fare ?? 0
).toFixed(2)}`,

                                ride.payMethod ?? "—",

                                <span
                                    className={`status status-${(
    ride.status ?? ""
)
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
                                >
                                    {ride.status ?? "—"}
                                </span>,

                                ride.createdAt
                                    ? new Date(
                                        ride.createdAt
                                    ).toLocaleString()
                                    : "—",

                                detailLink(
                                    "/rides",
                                    ride.rideId,
                                    "View"
                                )
                            ]}
                        />
                    }
                />

                <Route
                    path="/customers"
                    element={
                        <ListPage
                            title="Customers"
                            description="Manage customer accounts and history."
                            load={adminApi.customers}
                            columns={[
                                "Customer ID",
                                "Name",
                                "Mobile",
                                "Email",
                                "Wallet Balance",
                                "Status",
                                "Created",
                                "Action"
                            ]}
                            render={customer => [
                                <span className="ride-id">
                                    {customer.profileId?.slice(0, 8) ?? "—"}
                                </span>,

                                <div className="customer-list-profile">
                                    <div className="customer-list-name">
                                        <strong>
                                            {customer.fullName ?? "—"}
                                        </strong>
                                    </div>
                                </div>,

                                customer.mobileNumber ?? "—",

                                customer.email ?? "—",

                                <span className="wallet-balance">
                                    ₱{Number(
                                        customer.walletBalance ?? 0
                                    ).toFixed(2)}
                                </span>,

                                <span
                                    className={`status status-${String(
    customer.status ?? ""
)
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
                                >
                                    {customer.status ?? "—"}
                                </span>,

                                customer.createdAt
                                    ? new Date(
                                        customer.createdAt
                                    ).toLocaleDateString()
                                    : "—",

                                detailLink(
                                    "/customers",
                                    customer.profileId,
                                    "View"
                                )
                            ]}
                        />
                    }
                />

                <Route
                    path="/riders"
                    element={
                        <ListPage
                            title="Riders"
                            description="Manage rider accounts, vehicles, and activity."
                            load={adminApi.riders}
                            columns={[
                                "Rider ID",
                                "Name",
                                "Mobile",
                                "Vehicle",
                                "Plate No.",
                                "Wallet Balance",
                                "Status",
                                "Online",
                                "Created",
                                "Action"
                            ]}
                            render={rider => [
                                <span className="ride-id">
                                    {rider.profileId?.slice(0, 8) ?? "—"}
                                </span>,

                                <div className="rider-list-profile">
                                    <div className="rider-list-name">
                                        <strong>
                                            {rider.fullName ?? "—"}
                                        </strong>
                                    </div>
                                </div>,

                                rider.mobileNumber ?? "—",

                                <span className="vehicle-cell">
                                    {rider.vehicleType ?? "—"}
                                </span>,

                                rider.plateNo ?? "—",

                                <span
                                    className={
                                        Number(rider.walletBalance ?? 0) < 0
                                            ? "wallet-balance wallet-balance-negative"
                                            : "wallet-balance"
                                    }
                                >
                                    ₱{Number(
                                        rider.walletBalance ?? 0
                                    ).toFixed(2)}
                                </span>,

                                <span
                                    className={`status status-${String(
    rider.status ?? ""
)
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
                                >
                                    {rider.status ?? "—"}
                                </span>,

                                <span
                                    className={`status ${
    rider.isOnline
        ? "status-online"
        : "status-offline"
}`}
                                >
                                    {rider.isOnline
                                        ? "Online"
                                        : "Offline"}
                                </span>,

                                rider.createdAt
                                    ? new Date(
                                        rider.createdAt
                                    ).toLocaleString()
                                    : "—",

                                detailLink(
                                    "/riders",
                                    rider.profileId,
                                    "View"
                                )
                            ]}
                        />
                    }
                />

                <Route
                    path="/promos"
                    element={<PromoPage/>}
                />

                <Route
                    path="/customers/:id"
                    element={<CustomerDetailPage/>}
                />

                <Route
                    path="/riders/:id"
                    element={<RiderDetailPage/>}
                />

                <Route
                    path="/rides/:id"
                    element={<RideDetailPage/>}
                />
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
}