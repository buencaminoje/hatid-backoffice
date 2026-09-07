import { apiClient } from "./client";

export type Paginated<T> = {
    data: T[];
    page?: number;
    total?: number;
    totalPages?: number;
};

export interface AdminRide {
    rideId: string;
    status: string;
    pickupLocation: string;
    dropLocation: string;
    fare: number;
    payMethod: string;
    type: string;
    createdAt: string;
    category: string;
}

export interface SalesRide {
    ride_id: string;
    status: string;
    type: string | null;
    category: string | null;
    payment_method: string | null;
    fare: number | null;
    final_fare: number | null;
    gross_sale: number;
    marketing_subsidy: number;
    net_sale: number;
    platform_fee: number;
    created_at: string | null;
    completed_at: string | null;
}

export interface RiderRemittance {
    profileId?: string;
    profile_id?: string;
    id?: string;
    nickname?: string;
    mobileNumber?: string;
    mobile_number?: string;
    walletBalance?: number;
    wallet_balance?: number;
    remittanceAmount?: number;
    remittance_amount?: number;
    pendingRemittance?: number;
    pending_remittance?: number;
    status?: string;
}

export interface RiderRemittanceResponse {
    riders: RiderRemittance[];
    total: number;
    totalPending: number;
}

export interface DashboardData {
    activeRides: number;
    pendingRides: number;
    availableRides: number;
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

export const adminApi = {
    login: (payload: {
        email: string;
        password: string;
        userType: string;
        mobileNumber: string;
    }) =>
        apiClient.post(
            "/api/auth/login",
            payload
        ),

    logout: () =>
        apiClient.post(
            "/api/auth/logout"
        ),

    profilePic: (profileId: string) =>
        apiClient.get(
            "/api/auth/profile/pic/me",
            {
                params: {
                    queryProfileId: profileId,
                },
                responseType: "blob",
            }
        ),

    dashboard: () =>
        apiClient.get<{
            success: boolean;
            data: DashboardData;
        }>("/api/admin/dashboard"),

    availableRides: () =>
        apiClient.get(
            "/api/rides/available"
        ),

    rides: (
        page = 1,
        limit = 25
    ) =>
        apiClient.get<{
            success: boolean;
            data: {
                rides: AdminRide[];
            };
        }>("/api/rides", {
            params: {
                page,
                limit,
            },
        }),

    sales: (
        from?: string | null,
        to?: string | null,
        paymentMethod?: string | null,
        serviceType?: string | null,
        limit = 50,
        offset = 0
    ) =>
        apiClient.get<{
            success: boolean;
            data: SalesRide[];
        }>("/api/admin/sales", {
            params: {
                from: from || undefined,
                to: to || undefined,
                paymentMethod:
                    paymentMethod || undefined,
                serviceType:
                    serviceType || undefined,
                limit,
                offset,
            },
        }),

    ride: (id: string) =>
        apiClient.get(
            `/api/ride?rideId=${id}`
        ),

    customers: (
        page = 1,
        limit = 25
    ) =>
        apiClient.get(
            "/api/customers",
            {
                params: {
                    page,
                    limit,
                },
            }
        ),

    customer: (id: string) =>
        apiClient.get(
            `/api/customer?customerId=${id}`
        ),

    customerRides: (id: string) =>
        apiClient.get(
            `/api/rides?customerId=${id}`
        ),

    updateCustomerStatus: (
        customerId: string,
        status: string
    ) =>
        apiClient.patch(
            `/api/customer/status?customerId=${encodeURIComponent(
        customerId
    )}`,
            {
                customerId,
                status,
            }
        ),

    updateCustomerProfile: (
        customerId: string,
        payload: {
            nickname: string;
        }
    ) =>
        apiClient.patch(
            `/api/customer/profile?customerId=${encodeURIComponent(
        customerId
    )}`,
            {
                customerId,
                ...payload,
            }
        ),

    updateCustomerContact: (
        customerId: string,
        payload: {
            mobileNumber: string;
            email: string;
        }
    ) =>
        apiClient.patch(
            `/api/customer/contact?customerId=${encodeURIComponent(
        customerId
    )}`,
            {
                customerId,
                ...payload,
            }
        ),

    updateCustomerAddress: (
        customerId: string,
        payload: {
            address: string;
            city: string;
            postalCode: string;
        }
    ) =>
        apiClient.patch(
            `/api/customer/address?customerId=${encodeURIComponent(
        customerId
    )}`,
            {
                customerId,
                ...payload,
            }
        ),

    riders: (
        page = 1,
        limit = 25
    ) =>
        apiClient.get(
            "/api/riders",
            {
                params: {
                    page,
                    limit,
                },
            }
        ),

    riderRemittanceStatus: (
        page = 1,
        limit = 25
    ) => {
        const offset =
            Math.max(page - 1, 0) *
            Math.max(limit, 1);

        return apiClient.get<{
            success: boolean;
            data:
                | RiderRemittanceResponse
                | RiderRemittance[];
        }>(
            "/api/admin/riders/remittance_status",
            {
                params: {
                    limit,
                    offset,
                },
            }
        );
    },

    rider: (id: string) =>
        apiClient.get(
            `/api/rider?riderId=${id}`
        ),

    riderRides: (id: string) =>
        apiClient.get(
            `/api/rides?riderId=${id}`
        ),

    updateVehicle: (
        riderId: string,
        payload: {
            vehicleModel: string;
            vehicleType: string;
            vehicleColor: string;
            plateNo: string;
            vehicleStatus: string;
            licenseStatus: string;
            regBookStatus: string;
        }
    ) =>
        apiClient.patch(
            `/api/rider/vehicle?riderId=${encodeURIComponent(
        riderId
    )}`,
            {
                riderId,
                ...payload,
            }
        ),

    updateRiderStatus: (
        riderId: string,
        status: string
    ) =>
        apiClient.patch(
            `/api/rider/status?riderId=${encodeURIComponent(
        riderId
    )}`,
            {
                riderId,
                status,
            }
        ),

    updateRiderProfile: (
        riderId: string,
        payload: {
            firstName: string;
            lastName: string;
            fullName: string;
            nickname: string;
        }
    ) =>
        apiClient.patch(
            `/api/rider/profile?riderId=${encodeURIComponent(
        riderId
    )}`,
            {
                riderId,
                ...payload,
            }
        ),

    updateRiderContact: (
        riderId: string,
        payload: {
            mobileNumber: string;
            email: string;
        }
    ) =>
        apiClient.patch(
            `/api/rider/contact?riderId=${encodeURIComponent(
        riderId
    )}`,
            {
                riderId,
                ...payload,
            }
        ),

    updateRiderAddress: (
        riderId: string,
        payload: {
            address: string;
            city: string;
            postalCode: string;
        }
    ) =>
        apiClient.patch(
            `/api/rider/address?riderId=${encodeURIComponent(
        riderId
    )}`,
            {
                riderId,
                ...payload,
            }
        ),

    acceptRide: (
        rideId: string,
        riderId: string
    ) =>
        apiClient.post(
            "/api/ride/accept",
            {
                rideId,
                riderId,
            }
        ),

    promos: () =>
        apiClient.get(
            "/api/admin/promos"
        ),

    createPromo: (data: any) =>
        apiClient.post(
            "/api/admin/promos",
            data
        ),

    updatePromo: (
        id: string,
        data: any
    ) =>
        apiClient.patch(
            `/api/admin/promos/${id}`,
            data
        ),

    deletePromo: (id: string) =>
        apiClient.delete(
            `/api/admin/promos/${id}`
        ),
};