import { HealthInsuranceResponseDTO, UpdateRequestDTO } from "@/api/healthinsurance";
import dayjs from "dayjs";

// Function kiểm tra xem một chuỗi có khớp một từ khóa tìm kiếm không (case insensitive)
export const matchesSearch = (text: string | undefined, search: string | undefined): boolean => {
  if (!search || search.trim() === "") return true;
  if (!text) return false;
  return text.toLowerCase().includes(search.toLowerCase());
};

// Function kiểm tra xem một ngày có nằm trong khoảng ngày chọn không
export const isDateInRange = (
  date: string | undefined,
  range: [dayjs.Dayjs, dayjs.Dayjs] | undefined
): boolean => {
  if (!range || !date) return true;
  const [start, end] = range;
  const dateValue = dayjs(date);
  return dateValue.isAfter(start) && dateValue.isBefore(end.add(1, 'day'));
};

// Function chính để lọc dữ liệu của tab Verified
export const filterVerifiedInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email,
        item.fullName,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by Verification Status
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      if (!filters.verificationStatus.includes(item.verificationStatus)) return false;
    }

    // Filter by date ranges
    if (filters.validPeriod) {
      const validFromInRange = isDateInRange(item.validFrom, filters.validPeriod);
      const validToInRange = isDateInRange(item.validTo, filters.validPeriod);
      if (!validFromInRange && !validToInRange) return false;
    }

    if (filters.issueDate && !isDateInRange(item.issueDate, filters.issueDate)) return false;
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.updatedAt, filters.updatedAtRange)) return false;

    // Filter by image availability
    if (filters.hasImage !== undefined) {
      const hasImage = !!item.imageUrl;
      if (filters.hasImage !== hasImage && filters.hasImage !== undefined) return false;
    }

    // Filter by healthcare provider
    if (filters.healthcareProvider && filters.healthcareProvider.length > 0) {
      if (!filters.healthcareProvider.includes(item.healthcareProviderName)) return false;
    }

    return true;
  });
};

// Function để lọc dữ liệu của tab Initial
export const filterInitialInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.deadlineRange && !isDateInRange(item.deadline, filters.deadlineRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Verification
export const filterVerificationRequests = (
  data: UpdateRequestDTO[],
  filters: any
): UpdateRequestDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.requestedBy?.userName,
        item.requestedBy?.email,
        item.fullName,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.requestedBy?.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.requestedAt, filters.createdAtRange)) return false;
    if (filters.requestedAtRange && !isDateInRange(item.requestedAt, filters.requestedAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.reviewedAt, filters.updatedAtRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Update Request
export const filterUpdateRequests = (
  data: UpdateRequestDTO[],
  filters: any
): UpdateRequestDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.requestedBy?.userName,
        item.requestedBy?.email,
        item.fullName,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.requestedBy?.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.requestedAt, filters.createdAtRange)) return false;
    if (filters.requestedAtRange && !isDateInRange(item.requestedAt, filters.requestedAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.reviewedAt, filters.updatedAtRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Expired Update
export const filterExpiredUpdateInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.updatedAt, filters.updatedAtRange)) return false;
    if (filters.deadlineRange && !isDateInRange(item.deadline, filters.deadlineRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Expired
export const filterExpiredInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email,
        item.fullName,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.validPeriod) {
      const validFromInRange = isDateInRange(item.validFrom, filters.validPeriod);
      const validToInRange = isDateInRange(item.validTo, filters.validPeriod);
      if (!validFromInRange && !validToInRange) return false;
    }

    if (filters.issueDate && !isDateInRange(item.issueDate, filters.issueDate)) return false;
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.updatedAt, filters.updatedAtRange)) return false;

    // Filter by image availability
    if (filters.hasImage !== undefined) {
      const hasImage = !!item.imageUrl;
      if (filters.hasImage !== hasImage && filters.hasImage !== undefined) return false;
    }

    // Filter by healthcare provider
    if (filters.healthcareProvider && filters.healthcareProvider.length > 0) {
      if (!filters.healthcareProvider.includes(item.healthcareProviderName)) return false;
    }

    return true;
  });
};

// Function để lọc dữ liệu của tab Uninsured
export const filterUninsuredRecords = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Soft Delete
export const filterSoftDeletedInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by date ranges
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.updatedAt, filters.updatedAtRange)) return false;

    return true;
  });
};

// Function để lọc dữ liệu của tab Rejected
export const filterRejectedInsurances = (
  data: HealthInsuranceResponseDTO[],
  filters: any
): HealthInsuranceResponseDTO[] => {
  return data.filter((item) => {
    // Filter bằng text search
    if (filters.userSearch) {
      const userSearchFields = [
        item.user?.fullName,
        item.user?.userName,
        item.user?.email,
        item.fullName,
        item.healthInsuranceNumber
      ];
      const matches = userSearchFields.some(field => matchesSearch(field, filters.userSearch));
      if (!matches) return false;
    }

    // Filter by User ID
    if (filters.userId && item.user.id !== filters.userId) return false;

    // Filter by Status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Filter by Verification Status
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      if (!filters.verificationStatus.includes(item.verificationStatus)) return false;
    }

    // Filter by date ranges
    if (filters.validPeriod) {
      const validFromInRange = isDateInRange(item.validFrom, filters.validPeriod);
      const validToInRange = isDateInRange(item.validTo, filters.validPeriod);
      if (!validFromInRange && !validToInRange) return false;
    }

    if (filters.issueDate && !isDateInRange(item.issueDate, filters.issueDate)) return false;
    if (filters.createdAtRange && !isDateInRange(item.createdAt, filters.createdAtRange)) return false;
    if (filters.updatedAtRange && !isDateInRange(item.updatedAt, filters.updatedAtRange)) return false;

    // Filter by image availability
    if (filters.hasImage !== undefined) {
      const hasImage = !!item.imageUrl;
      if (filters.hasImage !== hasImage && filters.hasImage !== undefined) return false;
    }

    // Filter by healthcare provider
    if (filters.healthcareProvider && filters.healthcareProvider.length > 0) {
      if (!filters.healthcareProvider.includes(item.healthcareProviderName)) return false;
    }

    return true;
  });
};

// Function công cộng để lọc dữ liệu dựa vào tab
export const filterDataByTab = (
  tabKey: string,
  data: HealthInsuranceResponseDTO[] | UpdateRequestDTO[],
  filters: any
) => {
  switch (tabKey) {
    case "verified":
      return filterVerifiedInsurances(data as HealthInsuranceResponseDTO[], filters);
    case "initial":
      return filterInitialInsurances(data as HealthInsuranceResponseDTO[], filters);
    case "verification":
      return filterVerificationRequests(data as UpdateRequestDTO[], filters);
    case "updateRequest":
      return filterUpdateRequests(data as UpdateRequestDTO[], filters);
    case "expiredUpdate":
      return filterExpiredUpdateInsurances(data as HealthInsuranceResponseDTO[], filters);
    case "expired":
      return filterExpiredInsurances(data as HealthInsuranceResponseDTO[], filters);
    case "uninsured":
      return filterUninsuredRecords(data as HealthInsuranceResponseDTO[], filters);
    case "softDelete":
      return filterSoftDeletedInsurances(data as HealthInsuranceResponseDTO[], filters);
    case "rejected":
      return filterRejectedInsurances(data as HealthInsuranceResponseDTO[], filters);
    default:
      return data;
  }
}; 