import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Row, Col, Upload, Divider, Card, Typography, Space } from 'antd';
import { createHealthInsuranceManual } from '@/api/healthinsurance';
import { getUsers, UserProfile } from '@/api/user';
import { getUserInsuranceStatus } from '@/api/healthinsurance';
import { toast } from 'react-toastify';
import { 
  UploadOutlined, 
  UserOutlined, 
  IdcardOutlined,
  CalendarOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  NumberOutlined,
  FileImageOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateModal({ visible, onClose, onSuccess }: CreateModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string; email: string }[]>([]);

  useEffect(() => {
    if (visible) {
      fetchUsers();
      form.resetFields();
      setFileList([]);
      setImageFile(undefined);
    }
  }, [visible, form]);

  const fetchUsers = async () => {
    try {
      const users = await getUsers();
      const userRoleUsers = users.filter((user: UserProfile) => user.roles.includes('User'));
      
      // Filter users without insurance
      const usersWithStatus = await Promise.all(
        userRoleUsers.map(async (user: UserProfile) => {
          const status = await getUserInsuranceStatus(user.id);
          return { user, hasInsurance: status.hasInsurance };
        })
      );

      const availableUsers = usersWithStatus
        .filter(({ hasInsurance }) => !hasInsurance)
        .map(({ user }) => ({
          value: user.id,
          label: user.fullName,
          email: user.email
        }));

      setUserOptions(availableUsers);
    } catch (error) {
      toast.error("Unable to load users");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        validFrom: values.validFrom?.format('YYYY-MM-DD'),
        validTo: values.validTo?.format('YYYY-MM-DD'),
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
      };

      const response = await createHealthInsuranceManual(formattedValues, imageFile);
      if (response.isSuccess) {
        toast.success('Insurance created successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to create insurance');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (info: any) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (info.file.status === 'done') {
      setImageFile(info.file.originFileObj);
    }
  };

  return (
    <Modal
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Space>
            <IdcardOutlined />
            Create Health Insurance
          </Space>
        </Typography.Title>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Create Insurance
        </Button>,
      ]}
      width={1200}
      centered
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={24}>
          <Col span={8}>
            <Card title={<Space><UserOutlined /> Personal Information</Space>} className="shadow-sm">
              <Form.Item
                name="userId"
                label="Policyholder"
                rules={[{ required: true, message: 'Please select a policyholder!' }]}
              >
                <Select
                  showSearch
                  placeholder="Search by name"
                  optionFilterProp="label"
                  options={userOptions}
                  filterOption={(input, option) => 
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                  optionRender={(option) => (
                    <div>
                      <div>{option.data.label}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>{option.data.email}</div>
                    </div>
                  )}
                />
              </Form.Item>

              <Form.Item
                name="healthInsuranceNumber"
                label={
                  <Space>
                    <IdcardOutlined />
                    Insurance Number
                  </Space>
                }
                rules={[{ required: true, message: 'Please input insurance number!' }]}
              >
                <Input placeholder="Enter insurance number" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label={
                  <Space>
                    <UserOutlined />
                    Full Name
                  </Space>
                }
                rules={[{ required: true, message: 'Please input full name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label={
                  <Space>
                    <CalendarOutlined />
                    Date of Birth
                  </Space>
                }
                rules={[{ required: true, message: 'Please select date of birth!' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="gender"
                label={
                  <Space>
                    <UserSwitchOutlined />
                    Gender
                  </Space>
                }
                rules={[{ required: true, message: 'Please select gender!' }]}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card title={<Space><HomeOutlined /> Contact Information</Space>} className="shadow-sm">
              <Form.Item
                name="address"
                label={
                  <Space>
                    <HomeOutlined />
                    Address
                  </Space>
                }
              >
                <Input.TextArea 
                  rows={4} 
                  placeholder="Enter address"
                  style={{ resize: 'none' }}
                />
              </Form.Item>

              <Form.Item
                name="healthcareProviderName"
                label={
                  <Space>
                    <MedicineBoxOutlined />
                    Healthcare Provider Name
                  </Space>
                }
              >
                <Input placeholder="Enter healthcare provider name" />
              </Form.Item>

              <Form.Item
                name="healthcareProviderCode"
                label={
                  <Space>
                    <NumberOutlined />
                    Healthcare Provider Code
                  </Space>
                }
              >
                <Input placeholder="Enter healthcare provider code" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card title={<Space><CalendarOutlined /> Insurance Details</Space>} className="shadow-sm">
              <Form.Item
                name="validFrom"
                label={
                  <Space>
                    <CalendarOutlined />
                    Valid From
                  </Space>
                }
                rules={[{ required: true, message: 'Please select valid from date!' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="validTo"
                label={
                  <Space>
                    <CalendarOutlined />
                    Valid To
                  </Space>
                }
                rules={[{ required: true, message: 'Please select valid to date!' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="issueDate"
                label={
                  <Space>
                    <CalendarOutlined />
                    Issue Date
                  </Space>
                }
                rules={[{ required: true, message: 'Please select issue date!' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label={
                  <Space>
                    <FileImageOutlined />
                    Insurance Image
                  </Space>
                }
              >
                <Upload
                  accept="image/*"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  maxCount={1}
                  className="upload-list-inline"
                >
                  <Button icon={<UploadOutlined />} block>
                    Click to Upload Image
                  </Button>
                </Upload>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
