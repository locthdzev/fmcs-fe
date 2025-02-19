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

export const createCanteenItem = async (
    canteenItemData: CreateCanteenItemsDTO, 
    imageFile?: File
) => {
    try {
        const formData = new FormData();

        // Chuyển kiểu dữ liệu đúng với API Backend
        formData.append("itemName", canteenItemData.itemName);
        if (canteenItemData.description) formData.append("description", canteenItemData.description);
        formData.append("unitPrice", canteenItemData.unitPrice); // Giữ nguyên, Backend nhận decimal
        formData.append("available", String(canteenItemData.available)); // Chuyển boolean thành string
        formData.append("createdAt", canteenItemData.createdAt);
        if (canteenItemData.status) formData.append("status", canteenItemData.status);

        // Nếu có file ảnh, thêm vào FormData
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
    canteenItemData: UpdateCanteenItemsDTO,  // Đổi kiểu dữ liệu thành UpdateCanteenItemsDTO
    imageFile?: File
) => {
    try {
        const formData = new FormData();

        formData.append("itemName", canteenItemData.itemName);
        if (canteenItemData.description) formData.append("description", canteenItemData.description);
        formData.append("unitPrice", canteenItemData.unitPrice);
        formData.append("available", String(canteenItemData.available));
        if (canteenItemData.updatedAt) formData.append("updatedAt", canteenItemData.updatedAt); // Thêm updatedAt khi cập nhật
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