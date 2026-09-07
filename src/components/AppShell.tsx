import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
    Outlet,
    useNavigate,
} from "react-router-dom";

import {
    LayoutDashboard,
    Radio,
    Car,
    Users,
    Bike,
    LogOut,
    TicketPercent,
    TrendingUp,
    WalletCards
} from "lucide-react";

import {adminApi} from "../api/admin";

import {
    apiClient,
    tokenStorage,
    userStorage,
} from "../api/client";

const items = [
    {
        to: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        to: "/sales",
        label: "Sales",
        icon: TrendingUp,
    },
    {
        to: "/remittances",
        label: "Pending Remittance",
        icon: WalletCards,
    },
    {
        to: "/available-rides",
        label: "Available Rides",
        icon: Radio,
    },
    {
        to: "/rides",
        label: "Rides",
        icon: Car,
    },
    {
        to: "/customers",
        label: "Customers",
        icon: Users,
    },
    {
        to: "/riders",
        label: "Riders",
        icon: Bike,
    },
    {
        to: "/promos",
        label: "Promos",
        icon: TicketPercent,
    },
];

export function AppShell() {
    const navigate = useNavigate();

    const [loggingOut, setLoggingOut] =
        useState(false);

    const [profilePicUrl, setProfilePicUrl] =
        useState<string | null>(null);

    const user = userStorage.get<{
        displayName?: string;
        fullName?: string;
        profilePic?: string;
    }>();

    useEffect(() => {
        let objectUrl: string | null = null;

        async function loadProfilePicture() {
            if (!user?.profilePic) {
                return;
            }

            try {
                const response =
                    await apiClient.get(
                        user.profilePic,
                        {
                            responseType: "blob",
                        }
                    );

                objectUrl =
                    URL.createObjectURL(
                        response.data
                    );

                setProfilePicUrl(objectUrl);
            } catch (error) {
                console.error(
                    "Failed to load profile picture",
                    error
                );
            }
        }

        loadProfilePicture();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(
                    objectUrl
                );
            }
        };
    }, [user?.profilePic]);

    async function handleLogout() {
        if (loggingOut) {
            return;
        }

        setLoggingOut(true);

        try {
            await adminApi.logout();
        } catch (error) {
            console.error(
                "Logout API failed",
                error
            );
        } finally {
            tokenStorage.clear();
            userStorage.clear();

            navigate("/login", {
                replace: true,
            });
        }
    }

    const displayName =
        user?.displayName ??
        user?.fullName ??
        "Admin";

    const initial =
        displayName
            .charAt(0)
            .toUpperCase();

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <img
                        src="/icon.png"
                        alt="Hatid"
                        className="brand-logo"
                    />

                    <div>
                        <b>HATID.PH</b>

                        <small>
                            BACKOFFICE
                        </small>
                    </div>
                </div>

                <nav>
                    {items.map(
                        ({
                             to,
                             label,
                             icon: Icon,
                         }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === "/"}
                                className={({
                                                 isActive,
                                             }) =>
                                    isActive
                                        ? "nav-item active"
                                        : "nav-item"
                                }
                            >
                                <Icon size={19}/>

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        )
                    )}
                </nav>

                <button
                    className="logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                >
                    <LogOut size={18}/>

                    <span>
                        {loggingOut
                            ? "Signing out..."
                            : "Sign out"}
                    </span>
                </button>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div>
                        <strong>
                            Management
                        </strong>

                        <span>
                            Operations Portal
                        </span>
                    </div>

                    <div className="admin-user">
                        <div className="admin-user-info">
                            <strong>
                                {displayName}
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>

                        {profilePicUrl ? (
                            <img
                                src={profilePicUrl}
                                alt={displayName}
                                className="profile-image"
                            />
                        ) : (
                            <div className="admin-avatar">
                                {initial}
                            </div>
                        )}
                    </div>
                </header>

                <div className="content">
                    <Outlet/>
                </div>
            </main>
        </div>
    );
}