import api from "./customize-axios";

export interface CanteenItemResponse {
    id: string;
    itemName: string;
    description?: string;
    unitPrice: string;
    available: string;
    createdAt: string;
    updatedAt?: string;
    status?: string;
}

export interface CreateCanteenItemsDTO {
    itemName: string;
    description?: string;
    unitPrice: string;
    available: string;
    createdAt: string;
    status?: string;
}

export interface UpdateCanteenItemsDTO {
    itemName: string;
    description?: string;
    unitPrice: string;
    available: string;
    updatedAt?: string;
    status?: string;
}

export const getAllCanteenItems = async () => {
    try {
        const response = await api.get('/canteen-items-management/canteen-items');
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getCanteenItem = async (id: string) => {
    try {
        const response = await api.get(`/canteen-items-management/canteen-items/${id}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const createCanteenItem = async (canteenItemData: CreateCanteenItemsDTO) => {
    try {
        const formData = new FormData();

        Object.entries(canteenItemData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });

        const response = await api.post(
            "/canteen-items-management/canteen-items",
            formData, // ✅ Gửi dưới dạng FormData (multipart/form-data)
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateCanteenItem = async (
    id: string,
    canteenItemData: UpdateCanteenItemsDTO
) => {
    try {
        const formData = new FormData();

        Object.entries(canteenItemData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value); // ✅ Giữ nguyên string
            }
        });

        const response = await api.put(
            `/canteen-items-management/canteen-items/${id}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    } catch (error) {
        throw error;
    }
};


export const activateCanteenItems = async (canteenItemIds: string[]) => {
    try {
        const response = await api.put(
            '/canteen-items-management/canteen-items/activate',
            canteenItemIds
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deactivateCanteenItems = async (canteenItemIds: string[]) => {
    try {
        const response = await api.put(
            '/canteen-items-management/canteen-items/deactivate',
            canteenItemIds
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};