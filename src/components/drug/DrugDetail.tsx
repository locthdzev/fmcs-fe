import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
  Modal,
  Image,
  Divider,
  Form,
  Input,
  Select,
  Upload,
  Popconfirm
} from "antd";
import dayjs from "dayjs";
import { getDrugById, DrugResponse, updateDrug, activateDrugs, deactivateDrugs } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  StopOutlined,
  InboxOutlined,
  CameraOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { DrugIcon } from "./Icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface DrugDetailProps {
  id: string;
}

export const DrugDetail: React.FC<DrugDetailProps> = ({ id }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [drug, setDrug] = useState<DrugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [drugGroups, setDrugGroups] = useState<any[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [formState, setFormState] = useState({
    drugCode: '',
    name: '',
    unit: '',
    price: '',
    drugGroupId: '',
    manufacturer: '',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchDrugDetails();
      fetchDrugGroups();
    }
  }, [id]);

  useEffect(() => {
    // Log the form values when entering editing mode
    if (isEditing && drug) {
      console.log("Entering edit mode with values:", {
        drugCode: form.getFieldValue('drugCode'),
        name: form.getFieldValue('name'),
        unit: form.getFieldValue('unit'),
        price: form.getFieldValue('price'),
        drugGroupId: form.getFieldValue('drugGroupId'),
        manufacturer: form.getFieldValue('manufacturer'),
        description: form.getFieldValue('description'),
      });
    }
  }, [isEditing, drug, form]);

  // Update formState when the drug data is loaded
  useEffect(() => {
    if (drug) {
      const newState = {
        drugCode: drug.drugCode || '',
        name: drug.name || '',
        unit: drug.unit || '',
        price: drug.price?.toString() || '',
        drugGroupId: drug.drugGroup?.id || '',
        manufacturer: drug.manufacturer || '',
        description: drug.description || '',
      };
      
      setFormState(newState);
      form.setFieldsValue(newState);
    }
  }, [drug, form]);

  const fetchDrugGroups = async () => {
    try {
      const response = await getDrugGroups();
      if (response && Array.isArray(response)) {
        setDrugGroups(response);
      } else if (response && response.isSuccess && Array.isArray(response.data)) {
        setDrugGroups(response.data);
      } else {
        setDrugGroups([]);
        messageApi.error("Failed to load drug groups: Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching drug groups:", error);
      messageApi.error("Failed to load drug groups");
      setDrugGroups([]);
    }
  };

  const fetchDrugDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugById(id);
      if (response && typeof response === 'object') {
         setDrug(response);
         if (response.imageUrl) {
           setImageUrl(response.imageUrl);
         }
         form.setFieldsValue({
           drugCode: response.drugCode,
           name: response.name,
           unit: response.unit,
           price: response.price,
           drugGroupId: response.drugGroup?.id,
           manufacturer: response.manufacturer,
           description: response.description,
         });
      } else {
         console.error("Invalid response structure:", response);
         messageApi.error("Failed to fetch drug details: Invalid data format");
         setDrug(null);
      }
    } catch (error) {
      console.error("Error fetching drug details:", error);
      messageApi.error("Failed to fetch drug details");
      setDrug(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return "-";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(numPrice);
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "error";
      default:
        return "default";
    }
  };

  const handleUpdate = async (values: any) => {
    if (!drug) return;
    
    setSubmitLoading(true);
    
    try {
      const formData = new FormData();
      
      // Append form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'imageFile') {
          formData.append(key, value as string);
        }
      });
      
      // Keep the original status
      formData.append("status", drug.status || "");
      
      // Thêm ImageUrl vào FormData
      formData.append("ImageUrl", drug.imageUrl || "");
      
      // Kiểm tra và chuẩn bị file
      if (fileList.length > 0) {
        console.log("FileList details:", {
          file: fileList[0],
          hasOriginFileObj: !!fileList[0].originFileObj,
          fileType: fileList[0].type,
          fileSize: fileList[0].size, 
          fileKeys: Object.keys(fileList[0])
        });
        
        // Trường hợp 1: File mới upload (có originFileObj)
        if (fileList[0].originFileObj) {
          console.log("Using originFileObj");
          formData.append("imageFile", fileList[0].originFileObj);
        }
        // Trường hợp 2: File không có originFileObj nhưng có url
        else if (fileList[0].url || fileList[0].thumbUrl) {
          console.log("Trying to fetch file from URL");
          try {
            const response = await fetch(fileList[0].url || fileList[0].thumbUrl || "");
            const blob = await response.blob();
            const file = new File([blob], fileList[0].name || "image.jpg", { type: blob.type });
            
            console.log("Created file from URL:", {
              name: file.name,
              type: file.type,
              size: file.size
            });
            
            formData.append("imageFile", file);
          } catch (error) {
            console.error("Error fetching image:", error);
            messageApi.error("Failed to process image");
          }
        }
        // Trường hợp 3: Có file trong fileList nhưng không thể xử lý
        else {
          console.warn("File in fileList cannot be processed");
          messageApi.warning("Cannot process the selected image file");
        }
      } 
      
      // Gọi API update
      await updateDrug(drug.id, formData);
      messageApi.success("Drug updated successfully");
      setIsEditing(false);
      
      // Refresh the drug details
      fetchDrugDetails();
      
      // Log FormData content for debugging
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
    } catch (error) {
      console.error("Error updating drug:", error);
      messageApi.error("Failed to update drug");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!drug) return;
    
    setStatusChangeLoading(true);
    try {
      await activateDrugs([drug.id]);
      messageApi.success("Drug activated successfully");
      fetchDrugDetails(); // Refresh to get the updated status
    } catch (error) {
      console.error("Error activating drug:", error);
      messageApi.error("Failed to activate drug");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!drug) return;
    
    setStatusChangeLoading(true);
    try {
      await deactivateDrugs([drug.id]);
      messageApi.success("Drug deactivated successfully");
      fetchDrugDetails(); // Refresh to get the updated status
    } catch (error) {
      console.error("Error deactivating drug:", error);
      messageApi.error("Failed to deactivate drug");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        messageApi.error('You can only upload JPG/PNG file!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        messageApi.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      
      // Tạo một file mới từ file ban đầu để đảm bảo nó có thể được sử dụng
      const newFile = new File([file], file.name, { type: file.type });
      
      // Tạo đối tượng upload file
      const uploadFile = {
        uid: Date.now().toString(),
        name: newFile.name,
        size: newFile.size,
        type: newFile.type,
        originFileObj: newFile
      } as UploadFile;
      
      setFileList([uploadFile]);
      return false;
    },
    maxCount: 1,
    fileList,
    onRemove: () => {
      setFileList([]);
      return true;
    },
    listType: "picture",
    className: "upload-list-inline",
  };

  const handleFormSubmit = () => {
    // Use formState directly for submission
    handleUpdate(formState);
  };

  const renderActionButtons = () => {
    if (!drug) return null;
    
    if (isEditing) {
      return (
        <Space>
          <Button 
            icon={<CloseOutlined />}
            onClick={() => {
              setIsEditing(false);
              // Reset form state to original values
              if (drug) {
                const resetState = {
                  drugCode: drug.drugCode || '',
                  name: drug.name || '',
                  unit: drug.unit || '',
                  price: drug.price?.toString() || '',
                  drugGroupId: drug.drugGroup?.id || '',
                  manufacturer: drug.manufacturer || '',
                  description: drug.description || '',
                };
                setFormState(resetState);
                form.setFieldsValue(resetState);
              }
              setFileList([]);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            icon={<SaveOutlined />}
            loading={submitLoading}
            onClick={handleFormSubmit}
          >
            Save
          </Button>
        </Space>
      );
    }
    
    return (
      <Space>
        {drug.status === "Active" ? (
          <Popconfirm
            title="Deactivate Drug"
            description="Are you sure you want to deactivate this drug?"
            onConfirm={handleDeactivate}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger
              icon={<StopOutlined />}
              loading={statusChangeLoading}
            >
              Deactivate
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Activate Drug"
            description="Are you sure you want to activate this drug?"
            onConfirm={handleActivate}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={statusChangeLoading}
            >
              Activate
            </Button>
          </Popconfirm>
        )}
        <Button 
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            setIsEditing(true);
          }}
        >
          Edit
        </Button>
      </Space>
    );
  };

  const handleInputChange = (fieldName: string, value: any) => {
    console.log(`Setting field ${fieldName} to:`, value);
    setFormState(prev => ({ ...prev, [fieldName]: value }));
    form.setFieldsValue({ [fieldName]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading drug details..." />
      </div>
    );
  }

  if (!drug) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/drug")}
                style={{ marginRight: "8px" }}
            >
                Back
            </Button>
            <DrugIcon />
            <h3 className="text-xl font-bold">Drug Not Found</h3>
        </div>
        <Card>
           <Text>The requested drug could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugIcon />
          <h3 className="text-xl font-bold">Drug Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <Card
            title={<Title level={5}>Drug Information</Title>}
            extra={
              <Tag color={getStatusColor(drug.status)}>
                {drug.status ? drug.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Form
              form={form}
              layout="vertical"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={6}>
                  <div className="flex flex-col items-center mb-4">
                    {/* Drug Image */}
                    <div className="relative mb-4">
                      {isEditing ? (
                        <div className="w-full">
                          {imageUrl && fileList.length === 0 ? (
                            <div className="relative">
                              <Image
                                src={imageUrl}
                                alt="Drug"
                                height={200}
                                style={{ 
                                  objectFit: 'contain', 
                                  maxWidth: '100%' 
                                }}
                                preview={true}
                              />
                              <Upload
                                {...uploadProps}
                                showUploadList={false}
                              >
                                <Button 
                                  icon={<CameraOutlined />} 
                                  shape="circle"
                                  className="absolute right-2 bottom-2 shadow-md"
                                />
                              </Upload>
                            </div>
                          ) : (
                            <Upload.Dragger {...uploadProps} className="w-full">
                              <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                              </p>
                              <p className="ant-upload-text">Click or drag image</p>
                              <p className="ant-upload-hint">JPG/PNG (max: 2MB)</p>
                            </Upload.Dragger>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          {drug.imageUrl ? (
                            <Image
                              src={drug.imageUrl}
                              alt={drug.name}
                              height={200}
                              style={{ 
                                objectFit: 'contain', 
                                maxWidth: '100%' 
                              }}
                              preview={{ 
                                mask: <EyeOutlined />,
                              }}
                            />
                          ) : (
                            <div className="bg-gray-100 flex items-center justify-center rounded" style={{ height: 200, width: '100%' }}>
                              <p className="text-gray-500">No image</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} md={18}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Drug Code</span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="drugCode"
                            value={formState.drugCode}
                            onChange={(e) => {
                              handleInputChange('drugCode', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.drugCode || "-"}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Name</span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formState.name}
                            onChange={(e) => {
                              handleInputChange('name', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.name || "-"}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Unit</span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="unit"
                            value={formState.unit}
                            onChange={(e) => {
                              handleInputChange('unit', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.unit || "-"}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Price</span>
                        {isEditing ? (
                          <input
                            type="number"
                            name="price"
                            value={formState.price}
                            onChange={(e) => {
                              handleInputChange('price', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{formatPrice(drug.price)}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Drug Group</span>
                        {isEditing ? (
                          <select
                            name="drugGroupId"
                            value={formState.drugGroupId}
                            onChange={(e) => {
                              handleInputChange('drugGroupId', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          >
                            {drugGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.groupName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.drugGroup?.groupName || "-"}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Manufacturer</span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="manufacturer"
                            value={formState.manufacturer}
                            onChange={(e) => {
                              handleInputChange('manufacturer', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.manufacturer || "-"}</div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Description</span>
                        {isEditing ? (
                          <textarea
                            name="description"
                            value={formState.description}
                            onChange={(e) => {
                              handleInputChange('description', e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm resize-none"
                            rows={3}
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">{drug.description || "No description available."}</div>
                        )}
                      </div>
                    </Col>
                    
                    <Col xs={24}>
                      <Divider style={{ margin: "8px 0" }} />
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Created At</span>
                        <div className="mt-1 w-full p-0">{formatDate(drug.createdAt)}</div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">Updated At</span>
                        <div className="mt-1 w-full p-0">{formatDate(drug.updatedAt)}</div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DrugDetail; 