import api from "./customize-axios";

export interface CanteenItemResponse {
    id: string;
    itemName: string;
    description?: string;
    unitPrice: number;   
    available: boolean;  
    createdAt: string;
    updatedAt?: string;
    imageUrl?: string;
    status?: "Active" | "Inactive"; 
}

export interface CreateCanteenItemsDTO {
    itemName: string;
    description?: string;
    unitPrice: number;  // ✅ Đổi từ string thành number
    available: boolean; // ✅ Đổi từ string thành boolean
    createdAt: string;
    status?: string;
}

export interface UpdateCanteenItemsDTO {
    itemName: string;
    description?: string;
    unitPrice: number; // ✅ Đổi từ string thành number
    available: boolean; // ✅ Đổi từ string thành boolean
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

export const createCanteenItem = async (
    canteenItemData: CreateCanteenItemsDTO, 
    imageFile?: File
) => {
    try {
        const formData = new FormData();

        formData.append("itemName", canteenItemData.itemName);
        if (canteenItemData.description) formData.append("description", canteenItemData.description);
        
        // Chuyển `unitPrice` thành string để gửi đi
        formData.append("unitPrice", canteenItemData.unitPrice.toString()); // ✅ Đảm bảo gửi số đúng dạng decimal
        
        formData.append("available", String(canteenItemData.available));
        formData.append("createdAt", canteenItemData.createdAt);
        if (canteenItemData.status) formData.append("status", canteenItemData.status);

        if (imageFile) {
            formData.append("imageFile", imageFile);
        }

        const response = await api.post(
            "/canteen-items-management/canteen-items",
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

export const updateCanteenItem = async (
    id: string,
    canteenItemData: UpdateCanteenItemsDTO,
    imageFile?: File
) => {
    try {
        const formData = new FormData();

        formData.append("itemName", canteenItemData.itemName);
        if (canteenItemData.description) formData.append("description", canteenItemData.description);
        
        // Chuyển `unitPrice` thành string đúng định dạng decimal
        formData.append("unitPrice", canteenItemData.unitPrice.toString());
        
        formData.append("available", String(canteenItemData.available));
        if (canteenItemData.updatedAt) formData.append("updatedAt", canteenItemData.updatedAt);
        if (canteenItemData.status) formData.append("status", canteenItemData.status);

        if (imageFile) {
            formData.append("imageFile", imageFile);
        }

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