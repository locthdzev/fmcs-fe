import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Row, Col, Upload, Image, Descriptions, Divider } from 'antd';
import { HealthInsuranceResponseDTO, updateHealthInsuranceByAdmin, requestHealthInsuranceUpdate } from '@/api/healthinsurance';
import { toast } from 'react-toastify';
import moment from 'moment';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface EditModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export default function EditModal({ visible, insurance, onClose, onSuccess, isAdmin = true }: EditModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  React.useEffect(() => {
    if (visible && insurance) {
      form.setFieldsValue({
        healthInsuranceNumber: insurance.healthInsuranceNumber,
        fullName: insurance.fullName,
        dateOfBirth: insurance.dateOfBirth ? moment(insurance.dateOfBirth) : null,
        gender: insurance.gender,
        address: insurance.address,
        healthcareProviderName: insurance.healthcareProviderName,
        healthcareProviderCode: insurance.healthcareProviderCode,
        validFrom: insurance.validFrom ? moment(insurance.validFrom) : null,
        validTo: insurance.validTo ? moment(insurance.validTo) : null,
        issueDate: insurance.issueDate ? moment(insurance.issueDate) : null,
      });

      if (insurance.imageUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'Current Image',
            status: 'done',
            url: insurance.imageUrl,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [visible, insurance, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        hasInsurance: true,
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        validFrom: values.validFrom?.format('YYYY-MM-DD'),
        validTo: values.validTo?.format('YYYY-MM-DD'),
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
      };

      const submitFunc = isAdmin ? updateHealthInsuranceByAdmin : requestHealthInsuranceUpdate;
      const response = await submitFunc(insurance!.id, formattedValues, imageFile);
      
      if (response.isSuccess) {
        toast.success(isAdmin ? 'Insurance updated successfully!' : 'Update request sent successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to update insurance');
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

  if (!insurance) return null;

  return (
    <Modal
      title={`${isAdmin ? 'Edit' : 'Request Update'} Health Insurance`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {isAdmin ? 'Save Changes' : 'Submit Request'}
        </Button>,
      ]}
      width={1200}
    >
      <Descriptions title="Policyholder Information" bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Full Name">{insurance.user.fullName}</Descriptions.Item>
        <Descriptions.Item label="Email">{insurance.user.email}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="healthInsuranceNumber"
              label="Insurance Number"
              rules={[{ required: true, message: 'Please input insurance number!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Please input full name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Please select date of birth!' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender!' }]}
            >
              <Select>
                <Select.Option value="Male">Male</Select.Option>
                <Select.Option value="Female">Female</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="address"
              label="Address"
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="healthcareProviderName"
              label="Healthcare Provider Name"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="healthcareProviderCode"
              label="Healthcare Provider Code"
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="validFrom"
              label="Valid From"
              rules={[{ required: true, message: 'Please select valid from date!' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="validTo"
              label="Valid To"
              rules={[{ required: true, message: 'Please select valid to date!' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="issueDate"
              label="Issue Date"
              rules={[{ required: true, message: 'Please select issue date!' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Insurance Image">
              <Upload
                accept="image/*"
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Upload New Image</Button>
              </Upload>
              {insurance?.imageUrl && !fileList.length && (
                <div style={{ marginTop: 8 }}>
                  <p>Current Image:</p>
                  <Image
                    src={insurance.imageUrl}
                    alt="Current Insurance"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
} 